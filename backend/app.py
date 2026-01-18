from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
# from scraper import FrontierScraper  # Commented out - using Amadeus API instead
from amadeus_api import AmadeusFlightSearch
from trip_planner import find_optimal_trips
from gowild_blackout import GoWildBlackoutDates
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
import os
import random
import time

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# ✅ UPDATED CORS: Explicitly allow all origins to prevent blocking
CORS(app, resources={r"/*": {"origins": "*"}})

# ==========================================
# 1. NEW CONFIGURATION (Database & Email)
# ==========================================

# Database: Looks for 'site.db' in your project folder
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Uploads: Where profile photos will be saved
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static/profile_pics')

# Email Config (Replace with real credentials for production)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'your-email@gmail.com')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'your-app-password')

# Initialize Extensions
db = SQLAlchemy(app)
mail = Mail(app)

# ==========================================
# 2. UPDATED USER MODELS
# ==========================================

# ✅ NEW: Join Table for User <-> Cities (Many-to-Many)
user_favorite_cities = db.Table('user_favorite_cities',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    db.Column('city_id', db.Integer, db.ForeignKey('cities.id', ondelete='CASCADE'), primary_key=True)
)

# ✅ NEW: Normalized City Model
class City(db.Model):
    __tablename__ = 'cities'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    def __repr__(self):
        return f"City('{self.name}')"

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False) 
    
    # Split Name into First and Last
    first_name = db.Column(db.String(50), nullable=False, default='')
    last_name = db.Column(db.String(50), nullable=False, default='')
    
    # Username is nullable (added in later steps)
    username = db.Column(db.String(50), unique=True, nullable=True)
    
    dob = db.Column(db.String(20), nullable=False, default='')
    image_file = db.Column(db.String(20), nullable=False, default='default.jpg')
    
    # Field is 'home_city'
    home_city = db.Column(db.String(200), nullable=True) 

    # New fields for onboarding data
    bio = db.Column(db.String(500), nullable=True)
    
    # Tracks if user has finished onboarding
    onboarding_complete = db.Column(db.String(5), nullable=False, default='No')

    # ✅ NEW: Relationship to City via join table
    fav_cities = db.relationship('City', secondary=user_favorite_cities, backref=db.backref('users', lazy='dynamic'))

    def __repr__(self):
        return f"User('{self.email}', '{self.first_name}', '{self.last_name}')"

# ✅ Table for Favorite Artists (Still string-based list for now)
class FavoriteArtists(db.Model):
    __tablename__ = 'favorite_artists'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    artists_list = db.Column(db.String(500), nullable=False)

    def __repr__(self):
        return f"FavoriteArtists('User {self.user_id}', '{self.artists_list}')"

# ==========================================
# 3. EXISTING AMADEUS & FLIGHT LOGIC
# ==========================================

# Initialize Amadeus API client
try:
    amadeus_client = AmadeusFlightSearch(
        api_key=os.environ.get('AMADEUS_API_KEY'),
        api_secret=os.environ.get('AMADEUS_API_SECRET')
    )
    AMADEUS_ENABLED = True
except ValueError as e:
    print(f"Warning: Amadeus API not configured: {e}")
    amadeus_client = None
    AMADEUS_ENABLED = False

# Development mode configuration
DEV_MODE = os.environ.get('DEV_MODE', 'false' if AMADEUS_ENABLED else 'true').lower() == 'true'

# Simple in-memory cache
cache = {}
CACHE_DURATION = timedelta(hours=1)

def get_cache_key(origins, destinations, departure_date, return_date, trip_type):
    """Generate a unique cache key for the search parameters"""
    return f"{','.join(sorted(origins))}_{','.join(sorted(destinations))}_{departure_date}_{return_date}_{trip_type}"

def is_cache_valid(cache_entry):
    """Check if cached entry is still valid"""
    if not cache_entry:
        return False
    cache_time = datetime.fromisoformat(cache_entry['timestamp'])
    return datetime.now() - cache_time < CACHE_DURATION

# ==========================================
# 4. API ROUTES
# ==========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Flight Search API is running',
        'amadeus_enabled': AMADEUS_ENABLED,
        'dev_mode': DEV_MODE
    })

# --- SIGNUP ENDPOINT (STEP 1) ---
@app.route('/api/signup', methods=['POST'])
def signup():
    print("DB:", db.engine.url)
    """
    Creates a user with basic info.
    """
    # 1. Get Text Data
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    email = request.form.get('email')
    password = request.form.get('password')
    
    # 2. Validation
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already taken.'}), 400

    # 3. Save to Database
    try:
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password,
            onboarding_complete='No' 
        )
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    # 4. Send Email
    try:
        msg = Message('Welcome to SetJet!', sender='noreply@setjet.com', recipients=[email])
        msg.body = f"Welcome {first_name}! Please complete your profile in the app."
        mail.send(msg)
    except Exception as e:
        print(f"Email failed (expected if creds are empty): {e}")

    return jsonify({'message': 'User created successfully!'}), 201


# --- GET USER INFO ENDPOINT ---
@app.route('/api/get_user_info', methods=['POST'])
def get_user_info():
    """
    Retrieves user details to pre-fill the onboarding form.
    """
    data = request.get_json()
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'first_name': user.first_name,
        'last_name': user.last_name,
        'username': user.username,
        'dob': user.dob,
        'bio': user.bio,
        'home_city': user.home_city,
        'image_file': user.image_file
    }), 200


# --- UPDATE PROFILE ENDPOINT (STEP 2: Onboarding Part 1) ---
@app.route('/api/update_profile', methods=['POST'])
def update_profile():
    """
    Updates user with Username, DOB, Bio, Home City, and Profile Pic.
    Does NOT set onboarding_complete to 'Yes' yet.
    """
    email = request.form.get('email')
    username = request.form.get('username')
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check username uniqueness
    existing_user_with_name = User.query.filter_by(username=username).first()
    if existing_user_with_name and existing_user_with_name.id != user.id:
        return jsonify({'error': 'Username already taken'}), 400

    # Handle File Upload
    if 'profile_photo' in request.files:
        file = request.files['profile_photo']
        if file.filename != '':
            filename = secure_filename(f"{user.id}_{file.filename}")
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            user.image_file = filename

    # Update Text Fields
    user.username = username
    user.dob = request.form.get('dob')
    user.bio = request.form.get('bio')
    user.home_city = request.form.get('home_city')
    
    try:
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully', 'onboarding_complete': 'No'}), 200
    except Exception as e:
        return jsonify({'error': f'Database update failed: {str(e)}'}), 500


# --- SAVE FAVORITE CITIES ENDPOINT (STEP 3: Onboarding Part 2) ---
@app.route('/api/save_favorite_cities', methods=['POST'])
def save_favorite_cities():
    """
    Saves the user's favorite cities into the normalized schema.
    Expects 'cities' as a pipe-separated string from frontend (e.g., "Denver, CO|Austin, TX").
    Does NOT complete onboarding yet.
    """
    data = request.get_json()
    email = data.get('email')
    cities_str = data.get('cities', '')  # Expecting pipe-separated string

    if not email:
        return jsonify({'error': 'Email required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        # Split string into list of city names
        city_names = [c.strip() for c in cities_str.split('|') if c.strip()]
        
        # 1. Clear existing favorites for this user (to handle updates/removals)
        user.fav_cities = []
        
        # 2. Add new favorites
        for name in city_names:
            # Find existing city or create new one
            city = City.query.filter_by(name=name).first()
            if not city:
                city = City(name=name)
                db.session.add(city)
            
            # Append to user's list (SQLAlchemy handles the join table insert)
            user.fav_cities.append(city)
        
        db.session.commit()
        return jsonify({'message': 'Favorite cities saved', 'onboarding_complete': 'No'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500


# --- SAVE FAVORITE ARTISTS ENDPOINT (STEP 4: Onboarding Part 3) ---
@app.route('/api/save_favorite_artists', methods=['POST'])
def save_favorite_artists():
    """
    Saves the user's favorite artists AND marks onboarding as complete.
    (Still using string list for Artists as requested)
    """
    data = request.get_json()
    email = data.get('email')
    artists_str = data.get('artists')  # Expecting pipe-separated string

    if not email:
        return jsonify({'error': 'Email required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        # Check if entry exists, update if so, else create new
        fav_entry = FavoriteArtists.query.filter_by(user_id=user.id).first()
        
        if fav_entry:
            fav_entry.artists_list = artists_str
        else:
            new_fav = FavoriteArtists(user_id=user.id, artists_list=artists_str)
            db.session.add(new_fav)
        
        # ✅ Mark Onboarding as Complete NOW
        user.onboarding_complete = 'Yes'
        
        db.session.commit()
        return jsonify({'message': 'Favorite artists saved', 'onboarding_complete': 'Yes'}), 200

    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500


# --- LOGIN ENDPOINT ---
@app.route('/api/login', methods=['POST'])
def login():
    print("DB:", db.engine.url)
    """
    Verifies user and returns onboarding status.
    """
    email = request.form.get('email')
    password = request.form.get('password')

    # Find user by email
    user = User.query.filter_by(email=email).first()

    # Verify password (Simple check for now)
    if user and user.password == password:
        return jsonify({
            'message': 'Login successful',
            'first_name': user.first_name,
            'onboarding_complete': user.onboarding_complete 
        }), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401
# ---------------------------

@app.route('/api/locations', methods=['GET'])
def search_locations():
    """Search for airports and cities by keyword for autocomplete"""
    keyword = request.args.get('keyword')
    
    if not keyword or len(keyword) < 2:
        return jsonify([])

    try:
        if AMADEUS_ENABLED and amadeus_client:
            results = amadeus_client.search_locations(keyword)
            return jsonify(results)
        
        elif DEV_MODE:
            mock_results = [
                {'label': f"Mock City - {keyword.title()} (MCK)", 'value': "MCK", 'type': "City", 'country': "United States"},
                {'label': f"Mock Airport - {keyword.title()} Intl (MAI)", 'value': "MAI", 'type': "Airport", 'country': "United States"}
            ]
            return jsonify(mock_results)
        else:
            return jsonify([])
            
    except Exception as e:
        print(f"Error in search_locations: {str(e)}")
        return jsonify([])

def generate_mock_flights(origins, destinations, departure_date, return_date=None):
    """Generate mock flight data for development/testing"""
    flights = []
    dest_list = destinations if destinations != ['ANY'] else ['MCO', 'LAS', 'MIA', 'PHX', 'ATL']
    blackout_info = GoWildBlackoutDates.is_flight_affected_by_blackout(departure_date, return_date)

    for origin in origins:
        for destination in dest_list[:5]:
            if origin == destination: continue
            for _ in range(random.randint(1, 2)):
                hour = random.randint(6, 20)
                minute = random.choice(['00', '15', '30', '45'])
                duration_hours = random.randint(2, 6)
                duration_mins = random.choice([0, 15, 30, 45])
                
                flights.append({
                    'origin': origin,
                    'destination': destination,
                    'departureDate': departure_date,
                    'departureTime': f"{hour:02d}:{minute} {'AM' if hour < 12 else 'PM'}",
                    'arrivalDate': departure_date,
                    'arrivalTime': f"{(hour + duration_hours) % 24:02d}:{duration_mins:02d} {'AM' if (hour + duration_hours) < 12 else 'PM'}",
                    'duration': f"{duration_hours}h {duration_mins}m",
                    'stops': random.choice([0, 0, 0, 1]),
                    'price': round(random.uniform(29, 199), 2),
                    'seatsRemaining': random.randint(1, 15),
                    'airline': 'Frontier Airlines',
                    'flightNumber': f"F9-{random.randint(1000, 9999)}",
                    'gowild_eligible': random.choice([True, True, False]),
                    'blackout_dates': blackout_info
                })
    return flights

@app.route('/api/search', methods=['POST'])
def search_flights():
    """Search for flights based on provided parameters"""
    try:
        data = request.get_json()
        origins = data.get('origins', [])
        destinations = data.get('destinations', [])
        trip_type = data.get('tripType', 'round-trip')
        departure_date = data.get('departureDate')
        return_date = data.get('returnDate')

        if not origins or not destinations or not departure_date:
            return jsonify({'error': 'Missing required fields: origins, destinations, departureDate'}), 400

        cache_key = get_cache_key(origins, destinations, departure_date, return_date, trip_type)

        if cache_key in cache and is_cache_valid(cache[cache_key]):
            print(f"Returning cached results for {cache_key}")
            return jsonify({
                'flights': cache[cache_key]['flights'],
                'cached': True,
                'searchParams': data,
                'devMode': DEV_MODE
            })

        if DEV_MODE:
            print(f"[DEV MODE] Generating mock flights for {origins} -> {destinations}")
            flights = generate_mock_flights(origins, destinations, departure_date, return_date)
        elif AMADEUS_ENABLED:
            print(f"[AMADEUS API] Searching flights for {origins} -> {destinations}")
            search_return_date = None if trip_type == 'one-way' else (departure_date if trip_type == 'day-trip' else return_date)
            
            flights = amadeus_client.search_flights(
                origins=origins,
                destinations=destinations,
                departure_date=departure_date,
                return_date=search_return_date,
                adults=1
            )
        else:
            print(f"ERROR: Neither Amadeus API nor scraper is available")
            return jsonify({'error': 'Flight search unavailable', 'devMode': DEV_MODE}), 503

        cache[cache_key] = {'flights': flights, 'timestamp': datetime.now().isoformat()}

        return jsonify({
            'flights': flights,
            'cached': False,
            'searchParams': data,
            'count': len(flights),
            'devMode': DEV_MODE
        })

    except Exception as e:
        print(f"Error in search_flights: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/stream', methods=['POST'])
def search_flights_stream():
    """Search for flights with streaming results (Server-Sent Events)"""
    try:
        data = request.get_json()
        origins = data.get('origins', [])
        destinations = data.get('destinations', [])
        trip_type = data.get('tripType', 'round-trip')
        departure_date = data.get('departureDate')
        return_date = data.get('returnDate')

        if not origins or not destinations or not departure_date:
            return jsonify({'error': 'Missing required fields'}), 400

        def generate():
            all_flights = []
            streamed_results = []

            def stream_callback(route, flights):
                streamed_results.append({'route': route, 'flights': flights, 'count': len(flights)})

            if DEV_MODE:
                # Mock streaming logic
                dest_list = destinations if destinations != ['ANY'] else ['MCO', 'LAS', 'MIA', 'PHX', 'ATL']
                blackout_info = GoWildBlackoutDates.is_flight_affected_by_blackout(departure_date, return_date)

                for origin in origins:
                    for destination in dest_list[:5]:
                        if origin == destination: continue
                        route_flights = []
                        for _ in range(random.randint(1, 3)):
                            # Simplified mock flight generation for stream
                            flight = {
                                'origin': origin, 'destination': destination,
                                'departure_date': departure_date, 'departure_time': "12:00 PM",
                                'arrival_time': "03:00 PM", 'duration': '3h 0m',
                                'price': round(random.uniform(29, 199), 2),
                                'airline': 'Frontier', 'flight_number': f"F9-{random.randint(100,999)}",
                                'stops': 0, 'blackout_dates': blackout_info
                            }
                            route_flights.append(flight)
                        
                        all_flights.extend(route_flights)
                        event_data = {'route': f"{origin}->{destination}", 'flights': route_flights, 'count': len(route_flights)}
                        yield f"data: {json.dumps(event_data)}\n\n"
                        time.sleep(0.1)

            elif AMADEUS_ENABLED:
                search_return_date = None if trip_type == 'one-way' else (departure_date if trip_type == 'day-trip' else return_date)
                
                all_flights = amadeus_client.search_flights(
                    origins=origins, destinations=destinations,
                    departure_date=departure_date, return_date=search_return_date,
                    adults=1, callback=stream_callback
                )

                for result in streamed_results:
                    yield f"data: {json.dumps(result)}\n\n"

            yield f"data: {json.dumps({'complete': True, 'total_flights': len(all_flights)})}\n\n"

        return Response(stream_with_context(generate()), mimetype='text/event-stream', headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})

    except Exception as e:
        print(f"Error in search_flights_stream: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/destinations', methods=['GET'])
def get_destinations():
    """Get list of all Frontier destinations"""
    return jsonify({'destinations': [], 'count': 0, 'message': 'Destination search not implemented with Amadeus API'})

@app.route('/api/trip-planner', methods=['POST'])
def trip_planner():
    """Plan trips based on desired trip length"""
    try:
        data = request.get_json()
        origins = data.get('origins', [])
        destinations = data.get('destinations', [])
        departure_date = data.get('departureDate')
        trip_length = data.get('tripLength')
        
        if not origins or not destinations or not departure_date or not trip_length:
            return jsonify({'error': 'Missing required fields'}), 400

        # Logic preserved from original file...
        # (Shortened for brevity in display, but logic is functionally identical to original)
        depart_dt = datetime.strptime(departure_date, '%Y-%m-%d')
        trip_hours = float(trip_length) * (24 if data.get('tripLengthUnit', 'days') == 'days' else 1)
        
        all_flights = []
        optimal_trips = []
        days_searched = 0
        
        while len(optimal_trips) == 0 and days_searched < 30:
            current_depart_dt = depart_dt + timedelta(days=days_searched)
            current_date_str = current_depart_dt.strftime('%Y-%m-%d')
            target_return = current_depart_dt + timedelta(hours=trip_hours)
            
            return_dates = [
                (target_return + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(-2, 3)
            ]

            print(f"Searching departure date: {current_date_str}")
            
            if AMADEUS_ENABLED:
                for r_date in return_dates:
                    flights = amadeus_client.search_flights(
                        origins=origins, destinations=destinations,
                        departure_date=current_date_str, return_date=r_date, adults=1
                    )
                    all_flights.extend(flights)

            optimal_trips = find_optimal_trips(
                all_flights, trip_length=trip_length,
                trip_length_unit=data.get('tripLengthUnit', 'days'),
                nonstop_preferred=data.get('nonstopPreferred', False),
                max_duration=data.get('maxTripDuration'),
                max_duration_unit=data.get('maxTripDurationUnit', 'days')
            )
            
            if len(optimal_trips) > 0: break
            days_searched += 1

        return jsonify({
            'flights': optimal_trips[:20],
            'total_options': len(optimal_trips),
            'days_searched': days_searched + 1
        })

    except Exception as e:
        print(f"Error in trip_planner: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    global cache
    cache = {}
    return jsonify({'message': 'Cache cleared successfully'})

@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    valid_entries = sum(1 for entry in cache.values() if is_cache_valid(entry))
    return jsonify({
        'total_entries': len(cache),
        'valid_entries': valid_entries,
        'expired_entries': len(cache) - valid_entries
    })

# ✅ MOVED: DB creation is now outside of 'if __main__' to ensure it runs when using 'flask run'
with app.app_context():
    db.create_all()
    print("Database initialized successfully.")

if __name__ == '__main__':
    # Run on port 5001 (5000 is often used by macOS AirPlay)
    app.run(debug=True, port=5001, host='127.0.0.1')
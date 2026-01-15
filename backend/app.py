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
CORS(app)  # Enable CORS for React frontend

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
# 2. NEW USER MODEL
# ==========================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False) 
    name = db.Column(db.String(100), nullable=False, default='')
    username = db.Column(db.String(50), unique=True, nullable=False)
    dob = db.Column(db.String(20), nullable=False, default='')
    image_file = db.Column(db.String(20), nullable=False, default='default.jpg')
    # Stores cities as "Denver,Miami,Austin"
    cities = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f"User('{self.email}', '{self.cities}')"

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

# --- NEW SIGNUP ENDPOINT ---
@app.route('/api/signup', methods=['POST'])
def signup():
    """
    Creates a user, uploads photo, saves cities, and sends email.
    """
    # 1. Get Text Data
    name = request.form.get('name')
    username = request.form.get('username')
    dob = request.form.get('dob')
    email = request.form.get('email')
    password = request.form.get('password')
    
    # Defaults to empty string since you aren't sending cities yet
    cities = request.form.get('cities', '') 

    # 2. Validation
    # We removed the 'cities' check since it's currently empty.
    # Check for existing user to prevent crashes
    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({'error': 'Email or Username already taken.'}), 400

    # 3. Handle Image Upload
    filename = 'default.jpg'
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # This will skip if no file is sent (which matches your current setup)
    if 'profile_photo' in request.files:
        file = request.files['profile_photo']
        if file.filename != '':
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    # 4. Save to Database
    try:
        new_user = User(
            name=name,
            username=username,
            dob=dob,
            email=email,
            password=password,
            image_file=filename,
            cities=cities
        )
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    # 5. Send Email
    try:
        msg = Message('Welcome to SetJet!', sender='noreply@setjet.com', recipients=[email])
        msg.body = f"Welcome {name}! Your account has been created successfully."
        mail.send(msg)
    except Exception as e:
        print(f"Email failed (expected if creds are empty): {e}")
        # We don't return an error here so the user creation still succeeds

    return jsonify({'message': 'User created successfully!'}), 201
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

if __name__ == '__main__':
    # Initialize the database file if it doesn't exist
    with app.app_context():
        db.create_all()
        print("Database initialized successfully.")

    # Run on port 5001 (5000 is often used by macOS AirPlay)
    app.run(debug=True, port=5001, host='127.0.0.1')
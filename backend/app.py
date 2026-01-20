from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
# from scraper import FrontierScraper  # Commented out - using Amadeus API instead
from amadeus_api import AmadeusFlightSearch
from trip_planner import find_optimal_trips
from gowild_blackout import GoWildBlackoutDates
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
import json
import os
import random
import time
import traceback  # ✅ ADDED: Required for printing error logs

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# ✅ UPDATED CORS: Explicitly allow all origins to prevent blocking
CORS(app)

# ==========================================
# 1. NEW CONFIGURATION (Database & Email)
# ==========================================

# Determine the absolute path to the backend folder
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

# ✅ Create 'instance' folder if it doesn't exist
os.makedirs(instance_path, exist_ok=True)

# Database: Store in 'backend/instance/site.db'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(instance_path, 'site.db')
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

# Helper Dictionary for State Codes -> Full Names
US_STATES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
    'DC': 'District of Columbia'
}

# ==========================================
# 2. UPDATED USER MODELS
# ==========================================

# Join Table for User <-> Locations (Many-to-Many for Favorite Cities)
user_favorite_locations = db.Table('user_favorite_locations',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    db.Column('location_id', db.Integer, db.ForeignKey('locations.id', ondelete='CASCADE'), primary_key=True)
)

# ✅ NEW: Join Table for User <-> Artists (Many-to-Many)
user_favorite_artists = db.Table('user_favorite_artists',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    db.Column('artist_id', db.Integer, db.ForeignKey('artists.id', ondelete='CASCADE'), primary_key=True)
)

class Location(db.Model):
    __tablename__ = 'locations'

    # Columns matching your screenshot exactly
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    state_code = db.Column(db.String(10))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    region = db.Column(db.String(100))
    country = db.Column(db.String(100))

    # ✅ Relationship: location.airports
    # Uses Airport.location_id -> Location.id
    airports = db.relationship(
        'Airport',
        back_populates='location',
        cascade='all, delete-orphan',
        lazy=True
    )

    def __repr__(self):
        return f'<Location {self.name}>'


class Airport(db.Model):
    __tablename__ = 'airports'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)

    # NOTE:
    # Your screenshot shows iata_code as VARCHAR(3) but does NOT show uniqueness.
    # Keeping unique=True is usually correct in real airport data, but if you already
    # have duplicates in your DB this can break inserts/migrations.
    iata_code = db.Column(db.String(3), nullable=False, unique=True)  # e.g., "ATL"

    icao_code = db.Column(db.String(4))                               # e.g., "KATL"
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    timezone = db.Column(db.String(50))                               # e.g., "America/New_York"

    # ✅ Foreign key link to locations.id (your screenshot shows INTEGER location_id)
    # If you want airports to always belong to a location, set nullable=False.
    location_id = db.Column(
        db.Integer,
        db.ForeignKey('locations.id', ondelete='CASCADE'),
        nullable=True
    )

    # ✅ Back-populated relationship: airport.location
    location = db.relationship('Location', back_populates='airports')

    def __repr__(self):
        return f'<Airport {self.iata_code}>'

class Artist(db.Model):
    __tablename__ = "artists"

    id = db.Column(db.Integer, primary_key=True)

    # From spreadsheet
    display_name = db.Column(db.String(255), nullable=False)
    edmtrain_id = db.Column(db.Integer, unique=True, index=True, nullable=False)
    normalized_name = db.Column(db.String(255), index=True, nullable=False)

    # Nullable for now (future expansion)
    genres = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"<Artist {self.display_name}>"

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)

    first_name = db.Column(db.String(50), nullable=True, default='')
    last_name = db.Column(db.String(50), nullable=True, default='')
    username = db.Column(db.String(50), unique=True, nullable=True)

    # Store Date of Birth as SQL Date
    dob = db.Column(db.Date, nullable=True)

    image_file = db.Column(db.String(20), nullable=False, default='default.jpg')

    # Foreign Key to 'locations' table for Home City
    home_location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    home_location = db.relationship('Location', foreign_keys=[home_location_id])

    bio = db.Column(db.String(500), nullable=True)
    onboarding_complete = db.Column(db.String(5), nullable=False, default='No')

    # Relationship to Favorite Locations via join table
    fav_cities = db.relationship('Location', secondary=user_favorite_locations, backref=db.backref('users', lazy='dynamic'))

    # ✅ NEW: Relationship to Favorite Artists via join table
    fav_artists = db.relationship('Artist', secondary=user_favorite_artists, backref=db.backref('users', lazy='dynamic'))

    def __repr__(self):
        return f"User('{self.email}', '{self.first_name}', '{self.last_name}')"

# ==========================================
# 3. HELPER FUNCTIONS
# ==========================================

def get_or_create_location(location_str):
    """
    Parses a string like "Atlanta, GA" or "London, UK".
    Splits into City, State Code, looks up Full State Name.
    Finds or creates the record in 'locations' table.
    """
    if not location_str:
        return None

    # Clean input
    clean_str = location_str.strip()

    # Logic to split "City, Code"
    if ',' in clean_str:
        parts = clean_str.split(',')
        city_val = parts[0].strip()
        code_val = parts[1].strip()
    else:
        city_val = clean_str
        code_val = None

    # Map Code to Full Name (e.g. GA -> Georgia) if it exists in US_STATES
    # If not in US_STATES (e.g. international), just use the code as state or None
    full_state = US_STATES.get(code_val, code_val) if code_val else None

    # Check existence
    loc = Location.query.filter_by(name=clean_str).first()

    if not loc:
        loc = Location(
            name=clean_str,
            city=city_val,
            state=full_state,
            state_code=code_val
        )
        db.session.add(loc)
        db.session.commit()

    return loc

# ==========================================
# 4. EXISTING AMADEUS & FLIGHT LOGIC
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

DEV_MODE = os.environ.get('DEV_MODE', 'false' if AMADEUS_ENABLED else 'true').lower() == 'true'
cache = {}
CACHE_DURATION = timedelta(hours=1)

def get_cache_key(origins, destinations, departure_date, return_date, trip_type):
    return f"{','.join(sorted(origins))}_{','.join(sorted(destinations))}_{departure_date}_{return_date}_{trip_type}"

def is_cache_valid(cache_entry):
    if not cache_entry:
        return False
    cache_time = datetime.fromisoformat(cache_entry['timestamp'])
    return datetime.now() - cache_time < CACHE_DURATION

# ==========================================
# 5. API ROUTES
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

# --- GET RECORDS FROM LOCATIONS TABLE ---
@app.route('/api/db_locations', methods=['GET'])
def db_locations():
    keyword = request.args.get('keyword', '').strip()
    limit = int(request.args.get('limit', 25))

    if len(keyword) < 2:
        return jsonify([])

    like = f"%{keyword}%"

    # Search both "name" ("Atlanta, GA") and "city" ("Atlanta")
    rows = (Location.query
            .filter(db.or_(Location.name.ilike(like), Location.city.ilike(like)))
            .order_by(Location.city.asc())
            .limit(limit)
            .all())

    # Frontend only needs a label. Use Location.name as the display label.
    return jsonify([
        {
            "id": r.id,
            "name": r.name,
            "city": r.city,
            "state": r.state,
            "state_code": r.state_code,
            "displayLabel": r.name
        }
        for r in rows
    ])



# --- GET RECORDS FROM AIRPORTS + LOCATIONS (JOINED) ---
@app.route('/api/db_airports', methods=['GET'])
def db_airports():
    """Search local Airports table (joined to Locations) for autocomplete.

    Returns objects shaped like:
      { id, iata_code, airport_name, location_label }

    This is used by UserHome's Departing/Arrival airport dropdowns.
    """
    keyword = request.args.get('keyword', '').strip()
    limit = int(request.args.get('limit', 25))

    if len(keyword) < 2:
        return jsonify([])

    like = f"%{keyword}%"

    rows = (db.session.query(Airport, Location)
            .outerjoin(Location, Airport.location_id == Location.id)
            .filter(
                db.or_(
                    Airport.iata_code.ilike(like),
                    Airport.name.ilike(like),
                    Location.name.ilike(like),
                    Location.city.ilike(like)
                )
            )
            .order_by(Airport.iata_code.asc())
            .limit(limit)
            .all())

    payload = []
    for a, loc in rows:
        # Friendly label like: "Denver, CO" (or fallback to loc.name)
        location_label = None
        if loc:
            if loc.city and loc.state_code:
                location_label = f"{loc.city}, {loc.state_code}"
            else:
                location_label = loc.name

        payload.append({
            'id': a.id,
            'iata_code': a.iata_code,
            'airport_name': a.name,
            'location_label': location_label
        })

    return jsonify(payload)


# --- GET RECORDS FROM ARTISTS TABLE ---
@app.route('/api/db_artists', methods=['GET'])
def db_artists():
    keyword = request.args.get('keyword', '').strip()
    limit = int(request.args.get('limit', 25))

    if len(keyword) < 2:
        return jsonify([])

    like = f"%{keyword}%"

    rows = (Artist.query
            .filter(db.or_(Artist.display_name.ilike(like), Artist.normalized_name.ilike(like)))
            .order_by(Artist.display_name.asc())
            .limit(limit)
            .all())

    return jsonify([
        {
            "id": a.id,
            "display_name": a.display_name,
            "edmtrain_id": a.edmtrain_id,
            "normalized_name": a.normalized_name,
            "genres": a.genres,
            "image_url": a.image_url,
            "displayLabel": a.display_name
        }
        for a in rows
    ])

# --- SIGNUP ---
@app.route('/api/signup', methods=['POST'])
def signup():
    print(f"Connecting to DB at: {app.config['SQLALCHEMY_DATABASE_URI']}")
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    email = request.form.get('email')
    password = request.form.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already taken.'}), 400

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
        print("!!!!! CRASH DETECTED !!!!!")
        traceback.print_exc()  # ✅ This will print the exact error to your terminal
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    try:
        msg = Message('Welcome to SetJet!', sender='noreply@setjet.com', recipients=[email])
        msg.body = f"Welcome {first_name}! Please complete your profile in the app."
        mail.send(msg)
    except Exception as e:
        print(f"Email failed (expected if creds are empty): {e}")

    return jsonify({'message': 'User created successfully!'}), 201

# --- GET USER INFO ---
@app.route('/api/get_user_info', methods=['POST'])
def get_user_info():
    data = request.get_json()
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Convert Date object -> String for frontend
    dob_str = user.dob.strftime('%m/%d/%Y') if user.dob else ""

    # Get Home City Name from relationship
    home_city_str = user.home_location.name if user.home_location else ""

    # ✅ NEW: Include favorite artists for UserHome headliners
    # Shape matches what UserHome expects: { name, image }
    favorite_artists_payload = [
        {
            "id": a.id,
            "name": a.display_name,
            "image": a.image_url
        }
        for a in (user.fav_artists or [])
    ]

    return jsonify({
        'first_name': user.first_name,
        'last_name': user.last_name,
        'username': user.username,
        'dob': dob_str,
        'bio': user.bio,
        'home_city': home_city_str,
        'image_file': user.image_file,

        # ✅ NEW FIELD
        'favorite_artists': favorite_artists_payload
    }), 200

# --- UPDATE PROFILE (Onboarding Step 1) ---
@app.route('/api/update_profile', methods=['POST'])
def update_profile():
    email = request.form.get('email')
    username = request.form.get('username')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    existing_user_with_name = User.query.filter_by(username=username).first()
    if existing_user_with_name and existing_user_with_name.id != user.id:
        return jsonify({'error': 'Username already taken'}), 400

    if 'profile_photo' in request.files:
        file = request.files['profile_photo']
        if file.filename != '':
            filename = secure_filename(f"{user.id}_{file.filename}")
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            user.image_file = filename

    user.username = username
    user.bio = request.form.get('bio')

    # Handle DOB String -> Date conversion
    dob_input = request.form.get('dob') # 'mm/dd/yyyy'
    if dob_input:
        try:
            user.dob = datetime.strptime(dob_input, '%m/%d/%Y').date()
        except ValueError:
            pass

    # Handle Home City String -> Location Relation
    home_city_input = request.form.get('home_city') # "Atlanta, GA"
    if home_city_input:
        location = get_or_create_location(home_city_input)
        user.home_location = location

    try:
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully', 'onboarding_complete': 'No'}), 200
    except Exception as e:
        print("!!!!! PROFILE UPDATE CRASH !!!!!")
        traceback.print_exc()
        return jsonify({'error': f'Database update failed: {str(e)}'}), 500

# --- SAVE FAVORITE CITIES (Onboarding Step 2) ---
@app.route('/api/save_favorite_cities', methods=['POST'])
def save_favorite_cities():
    data = request.get_json()
    email = data.get('email')
    cities_str = data.get('cities', '')

    if not email:
        return jsonify({'error': 'Email required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        raw_items = [c.strip() for c in cities_str.split('|') if c.strip()]

        # Reset current favorites
        user.fav_cities = []

        for item in raw_items:
            # Parse & Link
            loc = get_or_create_location(item)
            if loc:
                user.fav_cities.append(loc)

        db.session.commit()
        return jsonify({'message': 'Favorite cities saved', 'onboarding_complete': 'No'}), 200

    except Exception as e:
        db.session.rollback()
        print("!!!!! CITY SAVE CRASH !!!!!")
        traceback.print_exc()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

# --- SAVE FAVORITE ARTISTS (Onboarding Step 3) ---
# ✅ UPDATED: Now receives IDs and links to Artist table rows
@app.route('/api/save_favorite_artists', methods=['POST'])
def save_favorite_artists():
    data = request.get_json()
    email = data.get('email')
    artist_ids = data.get('artist_ids', []) # Expected List of Integers

    if not email:
        return jsonify({'error': 'Email required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        # Clear existing favorites (so we can handle removals/updates clean)
        user.fav_artists = []

        if artist_ids:
            # Fetch all artist objects that match the provided IDs
            # This ensures only valid, existing artists are linked
            artists_to_add = Artist.query.filter(Artist.id.in_(artist_ids)).all()
            user.fav_artists.extend(artists_to_add)

        # Mark Onboarding as Complete
        user.onboarding_complete = 'Yes'

        db.session.commit()
        return jsonify({'message': 'Favorite artists saved', 'onboarding_complete': 'Yes'}), 200

    except Exception as e:
        db.session.rollback()
        print("!!!!! ARTIST SAVE CRASH !!!!!")
        traceback.print_exc()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

# --- LOGIN ---
@app.route('/api/login', methods=['POST'])
def login():
    email = request.form.get('email')
    password = request.form.get('password')

    user = User.query.filter_by(email=email).first()

    if user and user.password == password:
        return jsonify({
            'message': 'Login successful',
            'first_name': user.first_name,
            'onboarding_complete': user.onboarding_complete
        }), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

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

@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    return resp

# ✅ MOVED: DB creation
with app.app_context():
    db.create_all()
    print("Database initialized successfully.")
    print(f"DB Location: {os.path.join(instance_path, 'site.db')}")

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0', use_reloader=False)

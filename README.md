# 🚛 Truck Serial Management System

A real-time web-based queue management system for tracking truck unloading operations.

## 📋 Features

- **Real-time Queue Management**: Automatically assign and manage serial numbers for trucks
- **Admin Panel**: Secure authentication for adding trucks and managing the queue
- **Public Display**: Live view of current unloading status and upcoming trucks
- **Auto-refresh**: Public display updates every 10 seconds
- **Automatic Serial Shifting**: When a truck finishes, all serials shift forward automatically
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Vibrant gradients, glassmorphism effects, and smooth animations

## 🛠️ Technology Stack

- **Backend**: Node.js + Express
- **Database**: MySQL (via XAMPP)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Authentication**: Sessions + bcrypt
- **Auto-refresh**: Client-side polling

## 📁 Project Structure

```
truck-queue/
├── database/
│   └── setup.sql              # Database schema and initial data
├── server/
│   ├── config/
│   │   ├── db.js              # Database connection
│   │   └── session.js         # Session configuration
│   ├── controllers/
│   │   └── queueController.js # Queue management logic
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   └── trucks.js          # Truck management routes
│   ├── .env                   # Environment variables
│   ├── package.json           # Dependencies
│   └── server.js              # Main server file
├── admin/
│   ├── login.html             # Admin login page
│   └── dashboard.html         # Admin dashboard
├── public/
│   └── public.html            # Public display page
├── assets/
│   ├── css/
│   │   └── styles.css         # Main stylesheet
│   └── js/
│       ├── login.js           # Login functionality
│       ├── admin.js           # Admin dashboard logic
│       └── public.js          # Public display logic
├── index.html                 # Landing page
└── README.md                  # This file
```

## 🚀 Setup Instructions

### Prerequisites

- XAMPP installed with MySQL running
- Node.js installed (v14 or higher)
- Modern web browser

### Step 1: Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Click on "SQL" tab
4. Copy and paste the contents of `database/setup.sql`
5. Click "Go" to execute

This will create:
- Database: `truck_queue_db`
- Tables: `trucks`, `trucks_history`, `admin_users`
- Default admin user: username=`admin`, password=`admin123`

### Step 2: Install Node.js Dependencies

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/truck-queue/server
npm install
```

This will install:
- express
- mysql2
- express-session
- bcrypt
- cors
- dotenv

### Step 3: Configure Environment Variables

The `.env` file is already configured with default XAMPP settings:
- MySQL host: localhost
- MySQL user: root
- MySQL password: (empty)
- Database: truck_queue_db
- Server port: 3000

If your XAMPP MySQL has a different configuration, update the `.env` file accordingly.

### Step 4: Start the Node.js Server

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/truck-queue/server
npm start
```

You should see:
```
🚀 Truck Queue Management Server
✅ Database connected successfully
✅ Server running on http://localhost:3000
📊 API available at http://localhost:3000/api
```

### Step 5: Access the Application

1. **Landing Page**: http://localhost/truck-queue/index.html
2. **Admin Login**: http://localhost/truck-queue/admin/login.html
3. **Admin Dashboard**: http://localhost/truck-queue/admin/dashboard.html
4. **Public Display**: http://localhost/truck-queue/public/public.html

## 📱 Usage Guide

### Admin Workflow

1. **Login**:
   - Go to admin login page
   - Enter username: `admin`
   - Enter password: `admin123`
   - Click Login

2. **Add a Truck**:
   - Fill in the truck details form:
     - Licence Number (e.g., DHA-1234)
     - Driver Name
     - Driver Phone
     - Buyer Name
     - Destination
   - Click "Add Truck to Queue"
   - The system automatically assigns the next serial number

3. **Mark as Finished**:
   - Find the truck with Serial #1 (currently unloading)
   - Click "Mark as Finished"
   - Confirm the action
   - Queue automatically updates:
     - Serial 2 becomes Serial 1
     - Serial 3 becomes Serial 2
     - And so on...

### Public Display

1. Open the public display page on a monitor/screen
2. The page shows:
   - **Currently Unloading**: Serial #1 with full details
   - **Next in Queue**: Next 5 trucks waiting
3. Auto-refreshes every 10 seconds
4. No login required

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/check` - Check session status

### Truck Management
- `GET /api/trucks/queue` - Get current queue (public)
- `POST /api/trucks/add` - Add new truck (admin only)
- `POST /api/trucks/finish/:id` - Mark truck as finished (admin only)
- `GET /api/trucks/history` - Get completed trucks (admin only)

## 🎨 Design Features

- **Modern dark theme** with vibrant gradient accents
- **Glassmorphism** cards with backdrop blur
- **Smooth animations** for all interactions
- **Pulse effect** on Serial #1 (currently unloading)
- **Auto-shifting** visual feedback when queue updates
- **Responsive grid** layout for all screen sizes

## 🔐 Security

- Session-based authentication
- Bcrypt password hashing
- Protected admin routes
- CORS configuration
- SQL injection prevention (parameterized queries)

## 🐛 Troubleshooting

### Server won't start
- Ensure MySQL is running in XAMPP
- Check that port 3000 is not in use
- Verify database credentials in `.env`

### Can't login
- Ensure you ran the `setup.sql` script
- Default credentials: admin / admin123
- Check browser console for errors

### Public display not updating
- Verify Node.js server is running
- Check browser console for API errors
- Ensure CORS is configured correctly

### Queue not shifting after marking finished
- Check backend logs for errors
- Verify database transactions are working
- Refresh the page manually

## 📝 Default Credentials

- **Username**: admin
- **Password**: admin123

⚠️ **Change these in production!** To add a new admin user, use bcrypt to hash a password and insert into the `admin_users` table.

## 🎯 Future Enhancements

- Search functionality for trucks
- Export history to CSV/PDF
- SMS notifications for drivers
- Estimated waiting time calculation
- Multi-language support
- Dark/light theme toggle

## 📄 License

This project is open source and available for use in any commercial or personal projects.

## 👨‍💻 Support

For issues or questions, check the server logs and browser console for error messages.

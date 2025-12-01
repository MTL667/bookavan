-- BookAVan Database Schema
-- PostgreSQL database setup for van booking system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: bookings
-- Stores all van reservations made by employees
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- Table: blocked_slots
-- Stores maintenance periods and blocked time slots
CREATE TABLE IF NOT EXISTS blocked_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_blocked_datetime_range CHECK (end_datetime > start_datetime)
);

-- Table: photos
-- Stores van photos uploaded by administrators
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_datetime ON bookings(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_datetime ON blocked_slots(start_datetime, end_datetime);

CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at DESC);

-- Sample data (optional - remove in production)
-- INSERT INTO photos (id, file_name, file_url, uploaded_by, uploaded_at)
-- VALUES 
--   (uuid_generate_v4(), 'van-front.jpg', '/uploads/van-front.jpg', 'admin@company.com', NOW()),
--   (uuid_generate_v4(), 'van-side.jpg', '/uploads/van-side.jpg', 'admin@company.com', NOW());


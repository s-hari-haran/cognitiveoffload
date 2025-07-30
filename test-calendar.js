#!/usr/bin/env node

// Simple test script to check calendar functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testCalendarEndpoints() {
    console.log('🧪 Testing Calendar Functionality\n');

    try {
        // Test health check first
        console.log('1. Testing health check...');
        const healthResponse = await fetch(`${BASE_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);

        // Test debug today endpoint (requires auth, will fail but shows server response)
        console.log('\n2. Testing debug today endpoint (will show auth error)...');
        const todayResponse = await fetch(`${BASE_URL}/api/debug/today`);
        const todayData = await todayResponse.json();
        console.log('📅 Today debug response:', todayData);

        // Test debug calendar endpoint
        console.log('\n3. Testing debug calendar endpoint (will show auth error)...');
        const calendarResponse = await fetch(`${BASE_URL}/api/debug/calendar?date=2025-07-29`);
        const calendarData = await calendarResponse.json();
        console.log('📅 Calendar debug response:', calendarData);

        console.log('\n✅ Server is responding to requests');
        console.log('ℹ️  Auth errors are expected - these endpoints require authentication');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nPossible issues:');
        console.log('- Server not running on port 5000');
        console.log('- Database connection issues');
        console.log('- Environment variables not set');
    }
}

testCalendarEndpoints();

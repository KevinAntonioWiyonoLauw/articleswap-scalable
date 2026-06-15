#!/usr/bin/env bash

# Exit immediately if any command fails
set -eo pipefail

echo "================================================"
echo "Starting ArticleSwap"
echo "================================================"

# Ensure runtime directory exists
mkdir -p nginx_runtime

# Clear any previous logs by truncating them (non-destructive)
true > nginx_runtime/gateway1.log 2>/dev/null || true
true > nginx_runtime/gateway2.log 2>/dev/null || true


# Track PIDs of background processes
G1_PID=""
G2_PID=""

# Graceful shutdown handler
cleanup() {
    echo ""
    echo "================================================"
    echo "Stopping all services..."
    echo "================================================"
    
    if [ -n "$G1_PID" ]; then
        echo "Stopping API Gateway Instance 1 (PID: $G1_PID)..."
        kill "$G1_PID" 2>/dev/null || true
    fi
    
    if [ -n "$G2_PID" ]; then
        echo "Stopping API Gateway Instance 2 (PID: $G2_PID)..."
        kill "$G2_PID" 2>/dev/null || true
    fi
    
    echo "Stopping Nginx Load Balancer..."
    # Nginx default behavior is daemon, stop it via command argument
    nginx -p "$(pwd)" -c "$(pwd)/nginx.conf" -s stop 2>/dev/null || true
    
    echo "All services stopped."
    exit 0
}

# Register cleanup handler for standard termination signals
trap cleanup INT TERM EXIT

# Start API Gateway Instance 1
echo "Starting API Gateway Instance 1 on port 5173..."
cd api-gateway
npm run dev -- --port 5173 --host 127.0.0.1 --strictPort > ../nginx_runtime/gateway1.log 2>&1 &
G1_PID=$!

# Start API Gateway Instance 2
echo "Starting API Gateway Instance 2 on port 5174..."
npm run dev -- --port 5174 --host 127.0.0.1 --strictPort > ../nginx_runtime/gateway2.log 2>&1 &
G2_PID=$!

cd ..

# Start Nginx Load Balancer
echo "Starting Nginx Load Balancer on port 8080..."
nginx -p "$(pwd)" -c "$(pwd)/nginx.conf"

echo "================================================"
echo "Services started successfully!"
echo "Dashboard (Load Balanced): http://localhost:8080"
echo "API Gateway Instance 1   : http://localhost:5173"
echo "API Gateway Instance 2   : http://localhost:5174"
echo "================================================"
echo "Press Ctrl+C to terminate all services."

# Wait for background processes to finish
wait

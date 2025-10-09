#!/usr/bin/env python3
"""
Semantic Search Test Suite Runner

This script runs all semantic search related tests including:
- Unit tests for core semantic search functionality
- API route tests
- Integration tests

Usage:
    python tests/semantic_search_test_suite.py
    
Or run individual test files:
    pytest tests/unit/test_semantic_search.py -v
    pytest tests/chatbot-api/test_semantic_search_routes.py -v
    pytest tests/integration/test_semantic_search_integration.py -v
"""

import subprocess
import sys
import os
from pathlib import Path

def run_test_file(test_file, description):
    """Run a specific test file and return the result"""
    print(f"\n{'='*60}")
    print(f"Running {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            test_file, 
            '-v', 
            '--tb=short',
            '--color=yes'
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
    except Exception as e:
        print(f"Error running {test_file}: {e}")
        return False

def run_frontend_tests():
    """Run frontend React tests"""
    print(f"\n{'='*60}")
    print("Running Frontend React Tests")
    print(f"{'='*60}")
    
    frontend_dir = Path(__file__).parent.parent / "lib/user-interface/react-app"
    
    try:
        # Run semantic search component tests
        result = subprocess.run([
            'npm', 'test', '--', 
            '--testPathPattern=semantic-search',
            '--watchAll=false',
            '--coverage=false'
        ], cwd=frontend_dir, capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
    except Exception as e:
        print(f"Error running frontend tests: {e}")
        return False

def main():
    """Run all semantic search tests"""
    print("🧪 Semantic Search Test Suite")
    print("Running comprehensive tests for semantic search functionality...")
    
    test_results = []
    
    # Python backend tests
    test_files = [
        ("tests/unit/test_semantic_search.py", "Core Semantic Search Unit Tests"),
        ("tests/unit/test_semantic_search_simple.py", "Simple Logic Tests"),
        ("tests/unit/test_semantic_search_routes_simple.py", "API Route Logic Tests"),
        ("tests/integration/test_semantic_search_integration_simple.py", "Integration Logic Tests"),
    ]
    
    for test_file, description in test_files:
        success = run_test_file(test_file, description)
        test_results.append((description, success))
    
    # Frontend tests
    frontend_success = run_frontend_tests()
    test_results.append(("Frontend React Tests", frontend_success))
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    all_passed = True
    for description, success in test_results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{description:<40} {status}")
        if not success:
            all_passed = False
    
    print(f"\n{'='*60}")
    if all_passed:
        print("🎉 All semantic search tests PASSED!")
        sys.exit(0)
    else:
        print("💥 Some tests FAILED. Please check the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()

"""
Face Recognition Flask API using DeepFace
Easier to install and equally accurate
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from face_utils import (
    base64_to_image,
    register_face,
    verify_face,
    check_face_registered
)

app = Flask(__name__)
CORS(app)

# ============================================
# Health Check
# ============================================

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "face-recognition",
        "library": "DeepFace",
        "version": "1.0.0"
    })


# ============================================
# Face Registration
# ============================================

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        emp_id = data.get('emp_id')
        image_base64 = data.get('image')
        
        if not emp_id or not image_base64:
            return jsonify({
                "success": False,
                "message": "emp_id and image are required"
            }), 400
        
        print(f"\n========== FACE REGISTRATION (DeepFace) ==========")
        print(f"EmpId: {emp_id}")
        
        # Convert base64 to image
        image = base64_to_image(image_base64)
        if image is None:
            return jsonify({
                "success": False,
                "message": "Invalid image data"
            }), 400
        
        # Register face
        result = register_face(emp_id, image)
        
        if result["success"]:
            print(f"✅ Face registered for {emp_id}")
        else:
            print(f"❌ Registration failed: {result['message']}")
        
        print("=" * 55)
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500


# ============================================
# Face Verification
# ============================================

@app.route('/verify', methods=['POST'])
def verify():
    try:
        data = request.get_json()
        emp_id = data.get('emp_id')
        image_base64 = data.get('image')
        
        if not emp_id or not image_base64:
            return jsonify({
                "success": False,
                "message": "emp_id and image are required"
            }), 400
        
        print(f"\n========== FACE VERIFY (DeepFace) ==========")
        print(f"EmpId: {emp_id}")
        
        # Convert base64 to image
        image = base64_to_image(image_base64)
        if image is None:
            return jsonify({
                "success": False,
                "match": False,
                "message": "Invalid image data"
            }), 400
        
        # Verify face
        result = verify_face(emp_id, image)
        
        print(f"Match: {'YES ✅' if result.get('match') else 'NO ❌'}")
        print(f"Confidence: {result.get('confidence', 0):.1f}%")
        print("=" * 50)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({
            "success": False,
            "match": False,
            "message": str(e)
        }), 500


# ============================================
# Status Check
# ============================================

@app.route('/status/<emp_id>', methods=['GET'])
def get_status(emp_id):
    registered = check_face_registered(emp_id)
    return jsonify({
        "success": True,
        "emp_id": emp_id,
        "face_registered": registered
    })


# ============================================
# Live Verify (same as verify for now)
# ============================================

@app.route('/live-verify', methods=['POST'])
def live_verify():
    """Alias for verify - can add liveness later"""
    return verify()


# ============================================
# Run Server
# ============================================

if __name__ == '__main__':
    print("=" * 55)
    print("🐍 Python Face Recognition Service (DeepFace)")
    print("=" * 55)
    print("Endpoints:")
    print("  POST /register    - Register face")
    print("  POST /verify      - Verify face")
    print("  GET  /status/<id> - Check registration")
    print("  GET  /health      - Health check")
    print("=" * 55)
    
    app.run(host='0.0.0.0', port=5001, debug=True)

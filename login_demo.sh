#!/bin/bash
# AgriHub Login Demo Script
# Automates login with sample credentials and captures screenshots

ADB="/home/codespace/android-sdk/platform-tools/adb"
SHOTS="/workspaces/AAA/screenshots"
mkdir -p "$SHOTS"

echo "=== AgriHub Login Demo ==="

# Step 1: Check connectivity
echo "[1] Checking emulator..."
if ! $ADB devices | grep -q "emulator"; then
  echo "ERROR: No emulator found"
  exit 1
fi
echo "    Emulator ready"

# Step 2: Get fresh OTP from backend
echo "[2] Getting OTP from backend..."
OTP_RESP=$(curl -s -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}')
OTP=$(echo "$OTP_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('otp',''))" 2>/dev/null)
if [ -z "$OTP" ]; then
  echo "ERROR: Could not get OTP. Backend response: $OTP_RESP"
  exit 1
fi
echo "    OTP: $OTP"

# Step 3: Launch app
echo "[3] Launching app..."
$ADB shell am start -n com.agrihub.app/.MainActivity
sleep 3

# Screenshot: Login screen
$ADB exec-out screencap -p > "$SHOTS/01_login_screen.png"
echo "    Screenshot: 01_login_screen.png"

# Step 4: Tap phone field and type number
echo "[4] Entering phone number..."
$ADB shell input tap 540 1239      # Phone field center
sleep 0.5
$ADB shell input keyevent 123      # End key (move to end)
# Clear existing text
for i in {1..12}; do $ADB shell input keyevent KEYCODE_DEL; done
sleep 0.3
$ADB shell input text "9876543210"
sleep 1

# Screenshot: Phone entered
$ADB exec-out screencap -p > "$SHOTS/02_phone_entered.png"
echo "    Screenshot: 02_phone_entered.png"

# Step 5: Dismiss keyboard and tap Send OTP button
echo "[5] Tapping Send OTP..."
$ADB shell input keyevent KEYCODE_BACK   # Close keyboard
sleep 0.5
$ADB shell input tap 540 1451            # Send OTP button center
sleep 3

# Screenshot: OTP screen
$ADB exec-out screencap -p > "$SHOTS/03_otp_screen.png"
echo "    Screenshot: 03_otp_screen.png"

# Step 6: Dump UI to find OTP field positions
echo "[6] Finding OTP field positions..."
$ADB shell uiautomator dump /sdcard/ui2.xml 2>/dev/null
$ADB pull /sdcard/ui2.xml /tmp/ui2.xml 2>/dev/null
echo "    UI elements:"
grep 'EditText\|OTP\|otp\|Enter.*code' /tmp/ui2.xml | grep -o 'text="[^"]*".*bounds="[^"]*"' | head -10

# Get OTP field bounds  
OTP_BOUNDS=$(grep 'EditText' /tmp/ui2.xml | grep -o 'bounds="[0-9,\[\]]*"' | head -1)
echo "    OTP field: $OTP_BOUNDS"

# Step 7: Enter OTP digits - try tapping each digit field
# OTP screen typically has 6 separate boxes or one field
# Try finding the input field center
OTP_CENTER=$(grep 'EditText' /tmp/ui2.xml | grep -o 'bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' | head -1 | \
  python3 -c "import sys,re; b=sys.stdin.read(); m=re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',b); x=(int(m.group(1))+int(m.group(3)))//2 if m else 540; y=(int(m.group(2))+int(m.group(4)))//2 if m else 1200; print(f'{x} {y}')" 2>/dev/null)
echo "    OTP field center: $OTP_CENTER"

# Tap OTP field
$ADB shell input tap ${OTP_CENTER:-540 1200}
sleep 0.5
$ADB shell input text "$OTP"
sleep 1

# Screenshot: OTP entered
$ADB exec-out screencap -p > "$SHOTS/04_otp_entered.png"
echo "    Screenshot: 04_otp_entered.png"

# Step 8: Find and tap Verify button
echo "[7] Verifying OTP..."
VERIFY_BOUNDS=$(grep -i 'Verify' /tmp/ui2.xml | grep -o 'bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' | head -1 | \
  python3 -c "import sys,re; b=sys.stdin.read(); m=re.search(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',b); x=(int(m.group(1))+int(m.group(3)))//2 if m else 540; y=(int(m.group(2))+int(m.group(4)))//2 if m else 1500; print(f'{x} {y}')" 2>/dev/null)
echo "    Verify button: $VERIFY_BOUNDS"
$ADB shell input tap ${VERIFY_BOUNDS:-540 1500}
sleep 4

# Screenshot: After login
$ADB exec-out screencap -p > "$SHOTS/05_after_login.png"
echo "    Screenshot: 05_after_login.png"

# Step 9: Check if we're on onboarding or home screen
$ADB shell uiautomator dump /sdcard/ui3.xml 2>/dev/null
$ADB pull /sdcard/ui3.xml /tmp/ui3.xml 2>/dev/null
echo "    Current screen text elements:"
grep -o 'text="[^"]*"' /tmp/ui3.xml | grep -v 'text=""' | head -10

echo ""
echo "=== Login complete! Screenshots saved to /workspaces/AAA/screenshots/ ==="
ls -lh "$SHOTS"/*.png 2>/dev/null

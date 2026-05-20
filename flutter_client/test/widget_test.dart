import 'package:flutter_test/flutter_test.dart';
import 'package:health_tracker_flutter/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('renders the auth screen by default', (tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const HealthTrackerApp());
    await tester.pump();
    await tester.pump();

    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Username'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
  });
}

import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'file_saver.dart';

const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3000',
);

void main() {
  runApp(const HealthTrackerApp());
}

class HealthTrackerApp extends StatefulWidget {
  const HealthTrackerApp({super.key});

  static HealthTrackerAppState? of(BuildContext context) =>
      context.findAncestorStateOfType<HealthTrackerAppState>();

  @override
  State<HealthTrackerApp> createState() => HealthTrackerAppState();
}

class HealthTrackerAppState extends State<HealthTrackerApp> {
  ThemeMode _themeMode = ThemeMode.light;

  void toggleTheme() {
    setState(() {
      _themeMode =
          _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    });
  }

  bool get isDark => _themeMode == ThemeMode.dark;

  @override
  Widget build(BuildContext context) {
    const seed = Color(0xff0f9f7a);

    return MaterialApp(
      title: 'VITAL',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: seed,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xfff7faf8),
        fontFamily: 'Roboto',
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: Color(0xffdce8e2)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: Color(0xffdce8e2)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: seed, width: 1.6),
          ),
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: seed,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xff121212),
        fontFamily: 'Roboto',
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xff1e1e1e),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: Color(0xff333333)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: Color(0xff333333)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: seed, width: 1.6),
          ),
        ),
      ),
      home: const AppRoot(),
    );
  }
}

enum HealthType { weight, bloodPressure, heartRate, both }

extension HealthTypeLabel on HealthType {
  String get apiValue => switch (this) {
    HealthType.weight => 'WEIGHT',
    HealthType.bloodPressure => 'BLOOD_PRESSURE',
    HealthType.heartRate => 'HEART_RATE',
    HealthType.both => 'BOTH',
  };

  String get label => switch (this) {
    HealthType.weight => 'Weight',
    HealthType.bloodPressure => 'Blood Pressure',
    HealthType.heartRate => 'Heart Rate',
    HealthType.both => 'Weight + BP',
  };

  IconData get icon => switch (this) {
    HealthType.weight => Icons.monitor_weight_outlined,
    HealthType.bloodPressure => Icons.favorite_border,
    HealthType.heartRate => Icons.monitor_heart_outlined,
    HealthType.both => Icons.add_chart_outlined,
  };
}

class HealthLog {
  HealthLog({
    required this.type,
    required this.timestamp,
    this.id,
    this.userId,
    this.notes,
    this.weight,
    this.unit,
    this.systolic,
    this.diastolic,
    this.bpm,
  });

  final String? id;
  final String? userId;
  final HealthType type;
  final DateTime timestamp;
  final String? notes;
  final double? weight;
  final String? unit;
  final int? systolic;
  final int? diastolic;
  final int? bpm;

  factory HealthLog.fromJson(Map<String, dynamic> json) {
    return HealthLog(
      id: json['id']?.toString(),
      userId: json['userId']?.toString(),
      type: _typeFromApi(json['type']?.toString()),
      timestamp:
          DateTime.tryParse(json['timestamp']?.toString() ?? '') ??
          DateTime.now(),
      notes: json['notes']?.toString(),
      weight: _toDouble(json['weight']),
      unit: json['unit']?.toString(),
      systolic: _toInt(json['systolic']),
      diastolic: _toInt(json['diastolic']),
      bpm: _toInt(json['bpm']),
    );
  }

  Map<String, dynamic> toCreateJson() {
    final body = <String, dynamic>{
      'type': type.apiValue,
      'timestamp': timestamp.toIso8601String(),
      'notes': notes ?? '',
    };

    if (weight != null) {
      body['weight'] = weight;
      body['unit'] = unit ?? 'kg';
    }
    if (systolic != null) body['systolic'] = systolic;
    if (diastolic != null) body['diastolic'] = diastolic;
    if (bpm != null) body['bpm'] = bpm;

    return body;
  }

  String get primaryValue => switch (type) {
    HealthType.weight => '${_trim(weight)} ${unit ?? 'kg'}',
    HealthType.bloodPressure => '$systolic/$diastolic',
    HealthType.heartRate => '$bpm bpm',
    HealthType.both => '${_trim(weight)} ${unit ?? 'kg'}',
  };

  String? get secondaryValue =>
      type == HealthType.both ? '$systolic/$diastolic BP' : null;
}

class HealthApi {
  HealthApi(this._client);

  final http.Client _client;
  String? userName;
  String? scriptUrl;

  Future<void> connect(String name, String url) async {
    final uri = Uri.parse(url);
    if (!uri.isScheme('http') && !uri.isScheme('https')) {
      throw Exception('Invalid Script URL. It must start with http:// or https://');
    }
    userName = name;
    scriptUrl = url;
  }

  Future<List<HealthLog>> getLogs() async {
    if (scriptUrl == null || scriptUrl!.isEmpty || userName == null || userName!.isEmpty) {
      return [];
    }
    final separator = scriptUrl!.contains('?') ? '&' : '?';
    final requestUrl = '$scriptUrl${separator}userId=${Uri.encodeComponent(userName!)}';
    
    final response = await _client.get(Uri.parse(requestUrl));
    final data = _decode(response);
    if (data is! List) return [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(HealthLog.fromJson)
        .toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  Future<HealthLog> addLog(HealthLog log) async {
    if (scriptUrl == null || scriptUrl!.isEmpty || userName == null || userName!.isEmpty) {
      throw Exception('Apps Script configuration is missing');
    }

    final body = log.toCreateJson();
    body['userId'] = userName;

    // Send as text/plain to avoid browser CORS preflight OPTIONS request
    final response = await _client.post(
      Uri.parse(scriptUrl!),
      headers: {'Content-Type': 'text/plain'},
      body: jsonEncode(body),
    );

    final data = _decode(response);
    if (data is Map<String, dynamic> && data['status'] == 'success') {
      return HealthLog.fromJson(data['data']);
    } else if (data is Map<String, dynamic> && data['message'] != null) {
      throw Exception(data['message']);
    }
    throw Exception('Failed to save log to Sheets');
  }

  dynamic _decode(http.Response response) {
    final data = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = data is Map
          ? data['message']?.toString()
          : 'Request failed';
      throw Exception(message ?? 'Request failed');
    }
    return data;
  }
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});

  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  final _api = HealthApi(http.Client());
  var _booting = true;
  var _authenticated = false;
  var _page = 0;
  var _logs = <HealthLog>[];
  var _loadingLogs = false;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('ht_username');
    final url = prefs.getString('ht_script_url');
    if (!mounted) return;
    setState(() {
      _api.userName = name;
      _api.scriptUrl = url;
      _authenticated = name != null && name.isNotEmpty && url != null && url.isNotEmpty;
      _booting = false;
    });
    if (_authenticated) await _loadLogs();
  }

  Future<void> _authenticate(
    String name,
    String url,
  ) async {
    await _api.connect(name, url);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ht_username', name);
    await prefs.setString('ht_script_url', url);
    if (!mounted) return;
    setState(() => _authenticated = true);
    await _loadLogs();
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('ht_username');
    await prefs.remove('ht_script_url');
    if (!mounted) return;
    setState(() {
      _api.userName = null;
      _api.scriptUrl = null;
      _authenticated = false;
      _logs = [];
      _page = 0;
    });
  }

  Future<void> _loadLogs() async {
    setState(() => _loadingLogs = true);
    try {
      final logs = await _api.getLogs();
      if (mounted) setState(() => _logs = logs);
    } finally {
      if (mounted) setState(() => _loadingLogs = false);
    }
  }

  Future<void> _addLog(HealthLog log) async {
    final created = await _api.addLog(log);
    setState(() => _logs = [created, ..._logs]);
  }

  @override
  Widget build(BuildContext context) {
    if (_booting) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!_authenticated) {
      return AuthScreen(onSubmit: _authenticate);
    }

    return MainShell(
      page: _page,
      onPageChanged: (page) => setState(() => _page = page),
      onRefresh: _loadLogs,
      loadingLogs: _loadingLogs,
      logs: _logs,
      onAddLog: _addLog,
      onLogout: _logout,
    );
  }
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.onSubmit});

  final Future<void> Function(String userName, String scriptUrl) onSubmit;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _urlController = TextEditingController();
  var _loading = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.onSubmit(
        _nameController.text.trim(),
        _urlController.text.trim(),
      );
    } catch (error) {
      setState(() => _error = _cleanError(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const BrandMark(size: 88),
                    const SizedBox(height: 20),
                    Text(
                      'Welcome to Vital',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Configure your Google Sheets Apps Script connection to start tracking.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xff64756d),
                          ),
                    ),
                    const SizedBox(height: 28),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: "User's Name",
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                          ? "Enter your name"
                          : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        labelText: 'Google Apps Script URL',
                        prefixIcon: Icon(Icons.link_outlined),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Enter your Google Apps Script URL';
                        }
                        if (!value.trim().startsWith('http://') &&
                            !value.trim().startsWith('https://')) {
                          return 'URL must start with http:// or https://';
                        }
                        return null;
                      },
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      ErrorBanner(message: _error!),
                    ],
                    const SizedBox(height: 22),
                    FilledButton(
                      onPressed: _loading ? null : _submit,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Text(
                          _loading ? 'Please wait...' : 'Connect',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class MainShell extends StatelessWidget {
  const MainShell({
    super.key,
    required this.page,
    required this.onPageChanged,
    required this.onRefresh,
    required this.loadingLogs,
    required this.logs,
    required this.onAddLog,
    required this.onLogout,
  });

  final int page;
  final ValueChanged<int> onPageChanged;
  final Future<void> Function() onRefresh;
  final bool loadingLogs;
  final List<HealthLog> logs;
  final Future<void> Function(HealthLog log) onAddLog;
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 760;
    final pages = [
      DashboardScreen(
        logs: logs,
        loading: loadingLogs,
        goToLog: () => onPageChanged(1),
      ),
      LogScreen(onAddLog: onAddLog),
      HistoryScreen(logs: logs, loading: loadingLogs, onRefresh: onRefresh),
      StatsScreen(logs: logs),
      ProfileScreen(logs: logs, onLogout: onLogout),
    ];

    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            if (wide)
              NavigationRail(
                selectedIndex: page,
                onDestinationSelected: onPageChanged,
                labelType: NavigationRailLabelType.all,
                leading: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 18),
                  child: BrandMark(size: 46),
                ),
                destinations: _destinations
                    .map(
                      (item) => NavigationRailDestination(
                        icon: Icon(item.icon),
                        label: Text(item.label),
                      ),
                    )
                    .toList(),
              ),
            Expanded(
              child: Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: wide ? 1120 : 520),
                  child: pages[page],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: wide
          ? null
          : NavigationBar(
              selectedIndex: page,
              onDestinationSelected: onPageChanged,
              destinations: _destinations
                  .map(
                    (item) => NavigationDestination(
                      icon: Icon(item.icon),
                      label: item.label,
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({
    super.key,
    required this.logs,
    required this.loading,
    required this.goToLog,
  });

  final List<HealthLog> logs;
  final bool loading;
  final VoidCallback goToLog;

  @override
  Widget build(BuildContext context) {
    final latestWeight = logs.where((log) => log.weight != null).firstOrNull;
    final latestBp = logs.where((log) => log.systolic != null).firstOrNull;
    final latestHr = logs.where((log) => log.bpm != null).firstOrNull;
    final wide = MediaQuery.sizeOf(context).width >= 760;

    return AppScrollView(
      children: [
        Header(
          title: 'VITAL',
          subtitle: 'Your daily health snapshot',
          action: FilledButton.icon(
            onPressed: goToLog,
            icon: const Icon(Icons.add),
            label: const Text('Log'),
          ),
        ),
        if (loading) const LinearProgressIndicator(),
        const SizedBox(height: 18),
        GridWrap(
          wide: wide,
          children: [
            MetricCard(
              icon: Icons.monitor_weight_outlined,
              label: 'Weight',
              value: latestWeight?.primaryValue ?? '--',
              tone: const Color(0xff2563eb),
            ),
            MetricCard(
              icon: Icons.favorite_border,
              label: 'Blood Pressure',
              value: latestBp == null
                  ? '--'
                  : '${latestBp.systolic}/${latestBp.diastolic}',
              tone: const Color(0xffdc2626),
            ),
            MetricCard(
              icon: Icons.monitor_heart_outlined,
              label: 'Heart Rate',
              value: latestHr?.primaryValue ?? '--',
              tone: const Color(0xff7c3aed),
            ),
          ],
        ),
        const SizedBox(height: 22),
        SectionTitle(title: 'Recent logs', trailing: '${logs.length} total'),
        const SizedBox(height: 10),
        if (logs.isEmpty)
          const EmptyState(message: 'No health logs yet.')
        else
          ...logs.take(5).map((log) => LogTile(log: log)),
      ],
    );
  }
}

class LogScreen extends StatefulWidget {
  const LogScreen({super.key, required this.onAddLog});

  final Future<void> Function(HealthLog log) onAddLog;

  @override
  State<LogScreen> createState() => _LogScreenState();
}

class _LogScreenState extends State<LogScreen> {
  final _formKey = GlobalKey<FormState>();
  final _weight = TextEditingController();
  final _systolic = TextEditingController();
  final _diastolic = TextEditingController();
  final _bpm = TextEditingController();
  final _notes = TextEditingController();
  var _type = HealthType.weight;
  var _saving = false;

  @override
  void dispose() {
    _weight.dispose();
    _systolic.dispose();
    _diastolic.dispose();
    _bpm.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onAddLog(
        HealthLog(
          type: _type,
          timestamp: DateTime.now(),
          notes: _notes.text.trim(),
          weight: _usesWeight ? double.parse(_weight.text) : null,
          unit: _usesWeight ? 'kg' : null,
          systolic: _usesBp ? int.parse(_systolic.text) : null,
          diastolic: _usesBp ? int.parse(_diastolic.text) : null,
          bpm: _type == HealthType.heartRate ? int.parse(_bpm.text) : null,
        ),
      );
      _formKey.currentState!.reset();
      _weight.clear();
      _systolic.clear();
      _diastolic.clear();
      _bpm.clear();
      _notes.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Health log saved')));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(_cleanError(error))));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  bool get _usesWeight =>
      _type == HealthType.weight || _type == HealthType.both;
  bool get _usesBp =>
      _type == HealthType.bloodPressure || _type == HealthType.both;

  @override
  Widget build(BuildContext context) {
    return AppScrollView(
      children: [
        const Header(
          title: 'Log Health Data',
          subtitle: 'Capture a new reading',
        ),
        const SizedBox(height: 18),
        SegmentedButton<HealthType>(
          segments: HealthType.values
              .map(
                (type) => ButtonSegment(
                  value: type,
                  label: Text(type.label),
                  icon: Icon(type.icon),
                ),
              )
              .toList(),
          selected: {_type},
          onSelectionChanged: (selected) =>
              setState(() => _type = selected.first),
          showSelectedIcon: false,
        ),
        const SizedBox(height: 18),
        Form(
          key: _formKey,
          child: Column(
            children: [
              if (_usesWeight)
                AppField(
                  controller: _weight,
                  label: 'Weight (kg)',
                  icon: Icons.monitor_weight_outlined,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  validator: _positiveNumber,
                ),
              if (_usesBp) ...[
                AppField(
                  controller: _systolic,
                  label: 'Systolic',
                  icon: Icons.favorite_border,
                  keyboardType: TextInputType.number,
                  validator: _positiveInteger,
                ),
                AppField(
                  controller: _diastolic,
                  label: 'Diastolic',
                  icon: Icons.favorite_outline,
                  keyboardType: TextInputType.number,
                  validator: _positiveInteger,
                ),
              ],
              if (_type == HealthType.heartRate)
                AppField(
                  controller: _bpm,
                  label: 'Heart rate (BPM)',
                  icon: Icons.monitor_heart_outlined,
                  keyboardType: TextInputType.number,
                  validator: _positiveInteger,
                ),
              AppField(
                controller: _notes,
                label: 'Notes',
                icon: Icons.notes_outlined,
                maxLines: 4,
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _saving ? null : _submit,
                  icon: Icon(_saving ? Icons.hourglass_empty : Icons.check),
                  label: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Text(_saving ? 'Saving...' : 'Submit'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({
    super.key,
    required this.logs,
    required this.loading,
    required this.onRefresh,
  });

  final List<HealthLog> logs;
  final bool loading;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: AppScrollView(
        alwaysScrollable: true,
        children: [
          Header(
            title: 'History',
            subtitle: 'All saved readings',
            action: IconButton.filledTonal(
              onPressed: loading ? null : onRefresh,
              icon: const Icon(Icons.refresh),
            ),
          ),
          const SizedBox(height: 16),
          if (loading) const LinearProgressIndicator(),
          if (logs.isEmpty)
            const EmptyState(message: 'Pull to refresh or add a new log.')
          else
            ...logs.map((log) => LogTile(log: log)),
        ],
      ),
    );
  }
}

class StatsScreen extends StatelessWidget {
  const StatsScreen({super.key, required this.logs});

  final List<HealthLog> logs;

  @override
  Widget build(BuildContext context) {
    final weights = logs
        .where((log) => log.weight != null)
        .map((log) => ChartPoint(log.timestamp, log.weight!))
        .toList()
        .reversed
        .toList();
    final systolic = logs
        .where((log) => log.systolic != null)
        .map((log) => ChartPoint(log.timestamp, log.systolic!.toDouble()))
        .toList()
        .reversed
        .toList();

    return AppScrollView(
      children: [
        const Header(title: 'Stats', subtitle: 'Trends at a glance'),
        const SizedBox(height: 18),
        ChartCard(title: 'Weight', unit: 'kg', points: weights),
        ChartCard(title: 'Systolic BP', unit: 'mmHg', points: systolic),
      ],
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key, required this.logs, required this.onLogout});

  final List<HealthLog> logs;
  final Future<void> Function() onLogout;

  void _exportCsv(BuildContext context) {
    final buffer = StringBuffer();
    buffer.writeln('Timestamp,Type,Weight,Systolic,Diastolic,Unit,Notes');
    for (final log in logs) {
      final w = log.weight?.toString() ?? '';
      final s = log.systolic?.toString() ?? '';
      final d = log.diastolic?.toString() ?? '';
      final u = log.unit ?? '';
      final n = log.notes ?? '';
      final notesEscaped = n.contains(',') || n.contains('\n') || n.contains('"')
          ? '"${n.replaceAll('"', '""')}"'
          : n;
      buffer.writeln('${log.timestamp.toIso8601String()},${log.type.apiValue},$w,$s,$d,$u,$notesEscaped');
    }
    saveFile(buffer.toString(), 'health_logs.csv');
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Exporting CSV...')));
  }

  @override
  Widget build(BuildContext context) {
    final weightCount = logs.where((log) => log.weight != null).length;
    final bpCount = logs.where((log) => log.systolic != null).length;
    final appState = HealthTrackerApp.of(context);
    final isDark = appState?.isDark ?? false;

    return AppScrollView(
      children: [
        const Header(title: 'Profile', subtitle: 'Account and activity'),
        const SizedBox(height: 18),
        GridWrap(
          wide: MediaQuery.sizeOf(context).width >= 760,
          children: [
            MetricCard(
              icon: Icons.list_alt_outlined,
              label: 'Total Logs',
              value: '${logs.length}',
              tone: const Color(0xff0f766e),
            ),
            MetricCard(
              icon: Icons.monitor_weight_outlined,
              label: 'Weight Logs',
              value: '$weightCount',
              tone: const Color(0xff2563eb),
            ),
            MetricCard(
              icon: Icons.favorite_border,
              label: 'BP Logs',
              value: '$bpCount',
              tone: const Color(0xffdc2626),
            ),
          ],
        ),
        const SizedBox(height: 24),
        ListTile(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
          ),
          leading: Icon(isDark ? Icons.dark_mode : Icons.light_mode),
          title: const Text('Dark Mode'),
          trailing: Switch(
            value: isDark,
            onChanged: (val) => appState?.toggleTheme(),
          ),
        ),
        const SizedBox(height: 14),
        ListTile(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
          ),
          leading: const Icon(Icons.download),
          title: const Text('Export Data to CSV'),
          onTap: () => _exportCsv(context),
        ),
        const SizedBox(height: 24),
        FilledButton.tonalIcon(
          onPressed: onLogout,
          icon: const Icon(Icons.logout),
          label: const Padding(
            padding: EdgeInsets.symmetric(vertical: 14),
            child: Text('Log out'),
          ),
        ),
      ],
    );
  }
}

class Header extends StatelessWidget {
  const Header({
    super.key,
    required this.title,
    required this.subtitle,
    this.action,
  });

  final String title;
  final String subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: const Color(0xff64756d)),
              ),
            ],
          ),
        ),
        ?action,
      ],
    );
  }
}

class MetricCard extends StatelessWidget {
  const MetricCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    required this.tone,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              backgroundColor: tone.withValues(alpha: 0.12),
              foregroundColor: tone,
              child: Icon(icon),
            ),
            const SizedBox(height: 18),
            Text(label, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
    );
  }
}

class LogTile extends StatelessWidget {
  const LogTile({super.key, required this.log});

  final HealthLog log;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Theme.of(context).colorScheme.surface,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      child: ListTile(
        leading: CircleAvatar(child: Icon(log.type.icon)),
        title: Text(log.type.label),
        subtitle: Text(
          [
            _formatDate(log.timestamp),
            if ((log.notes ?? '').isNotEmpty) log.notes!,
          ].join(' · '),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              log.primaryValue,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            if (log.secondaryValue != null)
              Text(
                log.secondaryValue!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ],
        ),
      ),
    );
  }
}

class ChartCard extends StatefulWidget {
  const ChartCard({
    super.key,
    required this.title,
    required this.unit,
    required this.points,
  });

  final String title;
  final String unit;
  final List<ChartPoint> points;

  @override
  State<ChartCard> createState() => _ChartCardState();
}

class _ChartCardState extends State<ChartCard> {
  int? _selectedIndex;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasPoints = widget.points.length >= 2;

    String displayTitle = widget.title;
    String displaySub = widget.unit;
    if (_selectedIndex != null && _selectedIndex! < widget.points.length) {
      final pt = widget.points[_selectedIndex!];
      displayTitle = '${widget.title}: ${_trim(pt.value)} ${widget.unit}';
      displaySub = _formatDate(pt.date);
    }

    return Card(
      elevation: 0,
      color: theme.colorScheme.surface,
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionTitle(title: displayTitle, trailing: displaySub),
            const SizedBox(height: 14),
            SizedBox(
              height: 190,
              child: !hasPoints
                  ? const EmptyState(message: 'Add two or more logs to chart.')
                  : LayoutBuilder(
                      builder: (context, constraints) {
                        return GestureDetector(
                          onPanDown: (details) => _updateSelection(details.localPosition, constraints.maxWidth),
                          onPanUpdate: (details) => _updateSelection(details.localPosition, constraints.maxWidth),
                          onTapDown: (details) => _updateSelection(details.localPosition, constraints.maxWidth),
                          onPanEnd: (_) => setState(() => _selectedIndex = null),
                          onTapUp: (_) => setState(() => _selectedIndex = null),
                          onTapCancel: () => setState(() => _selectedIndex = null),
                          child: CustomPaint(
                            painter: LineChartPainter(
                              widget.points,
                              selectedIndex: _selectedIndex,
                              isDark: theme.brightness == Brightness.dark,
                            ),
                            size: Size.infinite,
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _updateSelection(Offset localPos, double width) {
    if (widget.points.isEmpty || width <= 0) return;
    final double indexDouble = (localPos.dx / width) * (widget.points.length - 1);
    final int index = indexDouble.round().clamp(0, widget.points.length - 1);
    if (_selectedIndex != index) {
      setState(() => _selectedIndex = index);
    }
  }
}

class LineChartPainter extends CustomPainter {
  LineChartPainter(this.points, {this.selectedIndex, required this.isDark});

  final List<ChartPoint> points;
  final int? selectedIndex;
  final bool isDark;

  @override
  void paint(Canvas canvas, Size size) {
    final values = points.map((point) => point.value).toList();
    final minValue = values.reduce(math.min);
    final maxValue = values.reduce(math.max);
    final range = math.max(1.0, maxValue - minValue);
    final path = Path();

    final mainColor = const Color(0xff0f9f7a);
    final line = Paint()
      ..color = mainColor
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final dot = Paint()..color = mainColor;
    final gridColor = isDark ? const Color(0xff2d3732) : const Color(0xffdce8e2);
    final grid = Paint()
      ..color = gridColor
      ..strokeWidth = 1;

    for (var i = 0; i < 4; i++) {
      final y = size.height * i / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }

    final calculatedOffsets = <Offset>[];
    for (var i = 0; i < points.length; i++) {
      final x = points.length == 1 ? 0.0 : size.width * i / (points.length - 1);
      final y = size.height - ((points[i].value - minValue) / range * size.height);
      final offset = Offset(x, y);
      calculatedOffsets.add(offset);

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, line);

    for (var i = 0; i < calculatedOffsets.length; i++) {
      if (i != selectedIndex) {
        canvas.drawCircle(calculatedOffsets[i], 3, dot);
      }
    }

    if (selectedIndex != null && selectedIndex! < calculatedOffsets.length) {
      final selectedOffset = calculatedOffsets[selectedIndex!];

      final selectionLine = Paint()
        ..color = mainColor.withValues(alpha: 0.4)
        ..strokeWidth = 1.5
        ..style = PaintingStyle.stroke;
      canvas.drawLine(
        Offset(selectedOffset.dx, 0),
        Offset(selectedOffset.dx, size.height),
        selectionLine,
      );

      final glow = Paint()..color = mainColor.withValues(alpha: 0.3);
      canvas.drawCircle(selectedOffset, 9, glow);
      canvas.drawCircle(selectedOffset, 4.5, dot);
    }
  }

  @override
  bool shouldRepaint(covariant LineChartPainter oldDelegate) =>
      oldDelegate.points != points || oldDelegate.selectedIndex != selectedIndex || oldDelegate.isDark != isDark;
}

class ChartPoint {
  ChartPoint(this.date, this.value);

  final DateTime date;
  final double value;
}

class AppField extends StatelessWidget {
  const AppField({
    super.key,
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
    this.validator,
    this.maxLines = 1,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;
  final FormFieldValidator<String>? validator;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)),
      ),
    );
  }
}

class AppScrollView extends StatelessWidget {
  const AppScrollView({
    super.key,
    required this.children,
    this.alwaysScrollable = false,
  });

  final List<Widget> children;
  final bool alwaysScrollable;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: alwaysScrollable ? const AlwaysScrollableScrollPhysics() : null,
      padding: EdgeInsets.fromLTRB(
        18,
        20,
        18,
        MediaQuery.paddingOf(context).bottom + 28,
      ),
      children: children,
    );
  }
}

class GridWrap extends StatelessWidget {
  const GridWrap({super.key, required this.wide, required this.children});

  final bool wide;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = wide ? math.min(3, children.length) : 1;
        final width = (constraints.maxWidth - (12 * (columns - 1))) / columns;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: children
              .map((child) => SizedBox(width: width.toDouble(), child: child))
              .toList(),
        );
      },
    );
  }
}

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: const Color(0xff0f9f7a),
          borderRadius: BorderRadius.circular(size * 0.3),
        ),
        child: Icon(Icons.favorite, color: Colors.white, size: size * 0.48),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle({super.key, required this.title, this.trailing});

  final String title;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
        ),
        if (trailing != null)
          Text(trailing!, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ],
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 28),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xff64756d)),
        ),
      ),
    );
  }
}

class ErrorBanner extends StatelessWidget {
  const ErrorBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xfffff1f2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xffffcdd2)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(message, style: const TextStyle(color: Color(0xffb42318))),
      ),
    );
  }
}

class _NavItem {
  const _NavItem(this.label, this.icon);

  final String label;
  final IconData icon;
}

const _destinations = [
  _NavItem('Home', Icons.home_outlined),
  _NavItem('Log', Icons.add_circle_outline),
  _NavItem('History', Icons.history),
  _NavItem('Stats', Icons.insights_outlined),
  _NavItem('Profile', Icons.person_outline),
];

HealthType _typeFromApi(String? value) => switch (value) {
  'BLOOD_PRESSURE' => HealthType.bloodPressure,
  'HEART_RATE' => HealthType.heartRate,
  'BOTH' => HealthType.both,
  _ => HealthType.weight,
};

double? _toDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString());
}

String _trim(double? value) {
  if (value == null) return '--';
  return value % 1 == 0 ? value.toInt().toString() : value.toStringAsFixed(1);
}

String _formatDate(DateTime date) {
  final local = date.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '$day/$month/${local.year} $hour:$minute';
}

String? _positiveNumber(String? value) {
  final parsed = double.tryParse(value ?? '');
  return parsed == null || parsed <= 0 ? 'Enter a valid number' : null;
}

String? _positiveInteger(String? value) {
  final parsed = int.tryParse(value ?? '');
  return parsed == null || parsed <= 0 ? 'Enter a valid number' : null;
}

String _cleanError(Object error) {
  final text = error.toString();
  return text.startsWith('Exception: ') ? text.substring(11) : text;
}

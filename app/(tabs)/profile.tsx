import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/Colors'
import { useAuth } from '../../contexts/AuthContext'
import { getSettings, updateSettings, UserSettings } from '../../lib/api'

export default function Profile() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      await updateSettings(settings)
      Alert.alert('Success', 'Settings saved successfully')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut()
            router.replace('/(auth)/login')
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to sign out')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>{user?.email}</Text>
      </View>

      <ScrollView>
        {/* Cycle Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cycle Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Average Cycle Length (days)</Text>
            <TextInput
              style={styles.settingInput}
              value={settings?.averageCycleLength.toString()}
              onChangeText={(text) =>
                setSettings((prev) =>
                  prev ? { ...prev, averageCycleLength: parseInt(text) || 28 } : null
                )
              }
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Average Period Length (days)</Text>
            <TextInput
              style={styles.settingInput}
              value={settings?.averagePeriodLength.toString()}
              onChangeText={(text) =>
                setSettings((prev) =>
                  prev ? { ...prev, averagePeriodLength: parseInt(text) || 5 } : null
                )
              }
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Reminder Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Reminders</Text>
            <Switch
              value={settings?.reminderEnabled}
              onValueChange={(value) =>
                setSettings((prev) =>
                  prev ? { ...prev, reminderEnabled: value } : null
                )
              }
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={settings?.reminderEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>

          {settings?.reminderEnabled && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Remind me (days before)</Text>
              <TextInput
                style={styles.settingInput}
                value={settings?.reminderDaysBefore.toString()}
                onChangeText={(text) =>
                  setSettings((prev) =>
                    prev ? { ...prev, reminderDaysBefore: parseInt(text) || 3 } : null
                  )
                }
                keyboardType="number-pad"
              />
            </View>
          )}
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveSettings}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={[styles.actionButtonText, { color: Colors.error }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Period Tracker v1.0.0</Text>
          <Text style={styles.footerText}>Made with ❤️ for your wellness</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  header: {
    padding: 24,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: Colors.white,
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
})


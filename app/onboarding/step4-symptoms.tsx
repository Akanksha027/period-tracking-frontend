import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { createPeriod, updateSettings, createSymptom } from '../../lib/api'

const symptoms = [
  { id: 'acne', label: 'Acne', icon: '😤', emoji: '⚫' },
  { id: 'headache', label: 'Headache', icon: '😣', emoji: '🤕' },
  { id: 'backache', label: 'Backache', icon: '🔴', emoji: '🫠' },
  { id: 'breast_sensitivity', label: 'Breast sensitivity', icon: '💗', emoji: '💕' },
  { id: 'cramps', label: 'Cramps', icon: '⚡', emoji: '💢' },
  { id: 'none', label: 'None of these', icon: '✖️', emoji: '✓' },
]

export default function OnboardingStep4() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleSymptom = (symptomId: string) => {
    if (symptomId === 'none') {
      setSelectedSymptoms([])
    } else {
      setSelectedSymptoms((prev) => {
        if (prev.includes(symptomId)) {
          return prev.filter((id) => id !== symptomId)
        } else {
          return [...prev.filter((id) => id !== 'none'), symptomId]
        }
      })
    }
  }

  const handleApply = async () => {
    setLoading(true)
    try {
      const lastPeriodDate = new Date(params.lastPeriodDate as string)
      const periodLength = parseInt(params.periodLength as string, 10)
      const cycleLength = parseInt(params.cycleLength as string, 10)

      // Create period entry
      await createPeriod({
        startDate: lastPeriodDate.toISOString(),
        flowLevel: 'medium',
      })

      // Update user settings
      await updateSettings({
        averagePeriodLength: periodLength,
        averageCycleLength: cycleLength,
      })

      // Create symptom entries for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedSymptoms.length > 0 && !selectedSymptoms.includes('none')) {
        for (const symptomId of selectedSymptoms) {
          await createSymptom({
            date: today.toISOString(),
            type: symptomId,
            severity: 3, // Medium severity for onboarding
          })
        }
      }

      // Navigate to home
      router.replace('/(tabs)/home')
    } catch (error: any) {
      console.error('[Onboarding] Error saving data:', error)
      Alert.alert('Error', 'Failed to save your information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    router.replace('/(tabs)/home')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How do you feel today?</Text>
        <Text style={styles.subtitle}>Your cycle can impact how you feel</Text>

        <Text style={styles.sectionTitle}>Select your symptoms</Text>

        <View style={styles.symptomsGrid}>
          {symptoms.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom.id)
            return (
              <TouchableOpacity
                key={symptom.id}
                style={[
                  styles.symptomCard,
                  isSelected && styles.symptomCardSelected,
                ]}
                onPress={() => toggleSymptom(symptom.id)}
              >
                <View style={styles.symptomIconContainer}>
                  <Text style={styles.symptomIcon}>{symptom.emoji}</Text>
                </View>
                <Text
                  style={[
                    styles.symptomLabel,
                    isSelected && styles.symptomLabelSelected,
                  ]}
                >
                  {symptom.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, loading && styles.applyButtonDisabled]}
          onPress={handleApply}
          disabled={loading}
        >
          <Text style={styles.applyButtonText}>
            {loading ? 'Saving...' : 'Apply'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  skipText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  symptomCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  symptomCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.secondary,
  },
  symptomIconContainer: {
    marginBottom: 8,
  },
  symptomIcon: {
    fontSize: 32,
  },
  symptomLabel: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  symptomLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})


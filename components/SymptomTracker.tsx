import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { createSymptom, deleteSymptom, Symptom, getSymptoms, createMood, getMoods, deleteMood, Mood } from '../lib/api'
import { symptomOptions, moodOptions, symptomData, SymptomType, MoodType } from '../lib/symptomTips'

interface SymptomTrackerProps {
  date: Date
  onClose?: () => void
  onSave?: () => void
}

export default function SymptomTracker({ date: initialDate, onClose, onSave }: SymptomTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([])
  const [selectedMoods, setSelectedMoods] = useState<MoodType[]>([])
  const [saving, setSaving] = useState(false)
  const [existingSymptoms, setExistingSymptoms] = useState<Symptom[]>([])
  const [existingMoods, setExistingMoods] = useState<Mood[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Reset selections first to prevent showing old data
    setSelectedSymptoms([])
    setSelectedMoods([])
    loadExistingData()
  }, [selectedDate])

  const loadExistingData = async () => {
    try {
      // Create dates in UTC to avoid timezone shifts
      const startOfDay = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0, 0, 0, 0
      ))
      const endOfDay = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        23, 59, 59, 999
      ))

      const [symptoms, moods] = await Promise.all([
        getSymptoms(startOfDay.toISOString(), endOfDay.toISOString()),
        getMoods(startOfDay.toISOString(), endOfDay.toISOString()),
      ])

      // Filter to exact date - compare dates without time
      const selectedYear = selectedDate.getFullYear()
      const selectedMonth = selectedDate.getMonth()
      const selectedDay = selectedDate.getDate()

      const filteredSymptoms = symptoms.filter(s => {
        const symptomDate = new Date(s.date)
        return symptomDate.getFullYear() === selectedYear &&
               symptomDate.getMonth() === selectedMonth &&
               symptomDate.getDate() === selectedDay
      })
      
      const filteredMoods = moods.filter(m => {
        const moodDate = new Date(m.date)
        return moodDate.getFullYear() === selectedYear &&
               moodDate.getMonth() === selectedMonth &&
               moodDate.getDate() === selectedDay
      })

      setExistingSymptoms(filteredSymptoms)
      setExistingMoods(filteredMoods)
      
      // ONLY set selected items if there's actually data - no auto-selection
      // Only select what was previously saved by the user
      if (filteredSymptoms.length > 0) {
        setSelectedSymptoms(filteredSymptoms.map(s => s.type as SymptomType))
      } else {
        setSelectedSymptoms([])
      }
      
      if (filteredMoods.length > 0) {
        setSelectedMoods(filteredMoods.map(m => m.type as MoodType))
      } else {
        setSelectedMoods([])
      }
    } catch (error) {
      console.error('Error loading existing data:', error)
      setExistingSymptoms([])
      setExistingMoods([])
      setSelectedSymptoms([])
      setSelectedMoods([])
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const toggleSymptom = (symptomType: SymptomType) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomType)
        ? prev.filter((s) => s !== symptomType)
        : [...prev, symptomType]
    )
  }

  const toggleMood = (moodType: MoodType) => {
    setSelectedMoods((prev) =>
      prev.includes(moodType)
        ? prev.filter((m) => m !== moodType)
        : [...prev, moodType]
    )
  }

  const formatDate = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateToCheck = new Date(date)
    dateToCheck.setHours(0, 0, 0, 0)

    if (dateToCheck.getTime() === today.getTime()) {
      return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateToCheck.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    }

    return dateToLocaleDateString(date)
  }

  const dateToLocaleDateString = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Create date in UTC to avoid timezone shifts
      const dateUTC = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        12, 0, 0, 0  // Use noon UTC to avoid day boundary issues
      ))
      const dateString = dateUTC.toISOString()
      
      // Delete ALL existing symptoms and moods for this date first
      for (const existingSymptom of existingSymptoms) {
        try {
          await deleteSymptom(existingSymptom.id)
        } catch (err) {
          console.log('Error deleting symptom:', err)
        }
      }

      // Save currently selected symptoms
      for (const symptomType of selectedSymptoms) {
        await createSymptom({
          date: dateString,
          type: symptomType,
          severity: 3, // Default severity
        })
      }

      // Delete ALL existing moods for this date first
      for (const existingMood of existingMoods) {
        try {
          await deleteMood(existingMood.id)
        } catch (err) {
          console.log('Error deleting mood:', err)
        }
      }

      // Save currently selected moods
      for (const moodType of selectedMoods) {
        await createMood({
          date: dateString,
          type: moodType,
        })
      }

      Alert.alert('💕 Saved!', 'Your symptoms and mood are saved.')
      onSave?.()
      onClose?.()
    } catch (error: any) {
      console.error('Error saving:', error)
      Alert.alert('Error', 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const filterOptions = (options: typeof symptomOptions | typeof moodOptions) => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase()
    return options.filter(opt => 
      opt.label.toLowerCase().includes(query) || 
      opt.emoji.includes(query)
    )
  }

  const symptoms = symptomOptions.filter(s => s.category === 'symptoms')
  const discharge = symptomOptions.filter(s => s.category === 'discharge')
  const digestion = symptomOptions.filter(s => s.category === 'digestion')
  const filteredSymptoms = filterOptions(symptoms) as typeof symptomOptions
  const filteredDischarge = filterOptions(discharge) as typeof symptomOptions
  const filteredDigestion = filterOptions(digestion) as typeof symptomOptions
  const filteredMoods = filterOptions(moodOptions)

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navButton}>
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Mood Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood</Text>
            <View style={styles.grid}>
              {filteredMoods.map((option) => {
                const isSelected = selectedMoods.includes(option.type)
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.button,
                      styles.moodButton,
                      isSelected && styles.buttonSelected,
                    ]}
                    onPress={() => toggleMood(option.type)}
                  >
                    <Text style={styles.buttonEmoji}>{option.emoji}</Text>
                    <Text style={[styles.buttonText, isSelected && styles.buttonTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Symptoms Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptoms</Text>
            <View style={styles.grid}>
              {filteredSymptoms.map((option) => {
                const isSelected = selectedSymptoms.includes(option.type)
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.button,
                      styles.symptomButton,
                      isSelected && styles.buttonSelected,
                    ]}
                    onPress={() => toggleSymptom(option.type)}
                  >
                    <Text style={styles.buttonEmoji}>{option.emoji}</Text>
                    <Text style={[styles.buttonText, isSelected && styles.buttonTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Vaginal Discharge Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vaginal discharge</Text>
            <View style={styles.grid}>
              {filteredDischarge.map((option) => {
                const isSelected = selectedSymptoms.includes(option.type)
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.button,
                      styles.symptomButton,
                      isSelected && styles.buttonSelected,
                    ]}
                    onPress={() => toggleSymptom(option.type)}
                  >
                    <Text style={styles.buttonEmoji}>{option.emoji}</Text>
                    <Text style={[styles.buttonText, isSelected && styles.buttonTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Digestion and Stool Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Digestion and stool</Text>
            <View style={styles.grid}>
              {filteredDigestion.map((option) => {
                const isSelected = selectedSymptoms.includes(option.type)
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.button,
                      styles.symptomButton,
                      isSelected && styles.buttonSelected,
                    ]}
                    onPress={() => toggleSymptom(option.type)}
                  >
                    <Text style={styles.buttonEmoji}>{option.emoji}</Text>
                    <Text style={[styles.buttonText, isSelected && styles.buttonTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 5,
    marginRight: 10,
  },
  dateNavigation: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  navButton: {
    padding: 5,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    width: '31%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButton: {
    backgroundColor: '#FFF3E0', // Light orange
  },
  symptomButton: {
    backgroundColor: '#F3E5F5', // Light purple
  },
  buttonSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFE5ED', // Light pink when selected
  },
  buttonEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})

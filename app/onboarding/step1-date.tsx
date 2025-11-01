import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

export default function OnboardingStep1() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios')

  const formatDate = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`
  }

  const formatDateShort = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  const getCalendarDates = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const dates: (Date | null)[] = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      if (current.getMonth() === month) {
        dates.push(new Date(current))
      } else {
        dates.push(null)
      }
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedDate(newDate)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    if (Platform.OS === 'android') {
      setShowPicker(false)
    }
  }

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step2-period-length',
      params: { lastPeriodDate: selectedDate.toISOString() },
    })
  }

  const calendarDates = getCalendarDates()
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Select the start date of your last period</Text>

        <View style={styles.calendarCard}>
          <Text style={styles.year}>{selectedDate.getFullYear()}</Text>
          <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>

          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthArrow}>
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {formatDateShort(selectedDate)}
            </Text>
            <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthArrow}>
              <Ionicons name="chevron-forward" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {daysOfWeek.map((day, idx) => (
              <View key={idx} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
            {calendarDates.map((date, idx) => {
              if (!date) {
                return <View key={idx} style={styles.dayCell} />
              }
              const isSelected =
                date.toDateString() === selectedDate.toDateString()
              const isToday = date.toDateString() === today.toDateString()

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay,
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.selectedDayText,
                      !isSelected && date.getMonth() !== selectedDate.getMonth() && styles.otherMonthDay,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(false)
            if (date) {
              handleDateSelect(date)
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  year: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  selectedDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrow: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  todayDay: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedDayText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  otherMonthDay: {
    color: Colors.textSecondary,
    opacity: 0.3,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
})




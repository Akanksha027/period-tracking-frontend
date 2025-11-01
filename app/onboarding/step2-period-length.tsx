import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors } from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'

const { height } = Dimensions.get('window')

export default function OnboardingStep2() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const scrollViewRef = useRef<ScrollView>(null)
  const [selectedLength, setSelectedLength] = useState(5)
  const numbers = Array.from({ length: 9 }, (_, i) => i + 2) // 2 to 10 days

  useEffect(() => {
    // Scroll to initial value
    const index = numbers.indexOf(selectedLength)
    if (index !== -1 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: index * 60,
          animated: false,
        })
      }, 100)
    }
  }, [])

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y
    const index = Math.round(offsetY / 60)
    const clampedIndex = Math.max(0, Math.min(index, numbers.length - 1))
    const newValue = numbers[clampedIndex]
    if (newValue !== selectedLength) {
      setSelectedLength(newValue)
      // Auto-scroll to snap to value
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: clampedIndex * 60,
            animated: true,
          })
        }
      }, 50)
    }
  }

  const scrollToValue = (value: number) => {
    const index = numbers.indexOf(value)
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: index * 60,
        animated: true,
      })
    }
  }

  const handleNext = () => {
    router.push({
      pathname: '/onboarding/step3-cycle-length',
      params: {
        lastPeriodDate: params.lastPeriodDate as string,
        periodLength: selectedLength.toString(),
      },
    })
  }

  const handleSkip = () => {
    router.push({
      pathname: '/onboarding/step3-cycle-length',
      params: {
        lastPeriodDate: params.lastPeriodDate as string,
        periodLength: '5', // default
      },
    })
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Enter the average length of your periods</Text>

        <View style={styles.pickerContainer}>
          <View style={styles.pickerWrapper}>
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={60}
              decelerationRate="fast"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.scrollContent}
            >
              {numbers.map((num) => (
                <View key={num} style={styles.pickerItem}>
                  <Text
                    style={[
                      styles.pickerText,
                      selectedLength === num && styles.pickerTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <View style={styles.selectedIndicator} />
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>I don't remember</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
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
    marginBottom: 40,
  },
  pickerContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  pickerWrapper: {
    height: 180,
    width: 200,
  },
  scrollContent: {
    paddingVertical: 90,
  },
  pickerItem: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 32,
    color: Colors.textSecondary,
  },
  pickerTextSelected: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
  },
  selectedIndicator: {
    position: 'absolute',
    width: '100%',
    height: 60,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    opacity: 0.3,
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    color: Colors.primary,
    fontSize: 16,
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


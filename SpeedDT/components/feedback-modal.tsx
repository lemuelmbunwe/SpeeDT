/**
 * Feedback Modal
 *
 * A bottom-sheet style modal that collects QoE ratings from users.
 * Appears periodically after a speed test is complete.
 *
 * Spec reference: docs/frontend-spec.md (lines 216-250)
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getDeviceId } from '@/services/storage';
import { submitFeedback } from '@/services/api';

type StarRatingProps = {
  label: string;
  value: number;
  onChange: (rating: number) => void;
};

function StarRating({ label, value, onChange }: StarRatingProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-brand-navy">{label}</Text>
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            className="p-1 active:opacity-70">
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={32}
              color={star <= value ? '#F59E0B' : '#CBD5E1'}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type FeedbackModalProps = {
  visible: boolean;
  onClose: () => void;
  metricId?: number | null; // optional link to the just-completed speed test
};

export function FeedbackModal({ visible, onClose, metricId = null }: FeedbackModalProps) {
  const insets = useSafeAreaInsets();
  const [overallRating, setOverallRating] = useState(0);
  const [speedRating, setSpeedRating] = useState(0);
  const [delayRating, setDelayRating] = useState(0);
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError('Please rate your overall satisfaction.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const deviceId = await getDeviceId();
      if (!deviceId) {
        throw new Error('Device not registered');
      }

      await submitFeedback({
        anonymous_id: deviceId,
        metric_id: metricId,
        overall_rating: overallRating,
        speed_rating: speedRating || 3,
        delay_rating: delayRating || 3,
        reliability_rating: reliabilityRating || 3,
        comment: comment.trim() || undefined,
      });

      setSubmitted(true);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (err) {
      setError('Unable to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLater = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setOverallRating(0);
    setSpeedRating(0);
    setDelayRating(0);
    setReliabilityRating(0);
    setComment('');
    setSubmitted(false);
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleLater}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/40">
        <View
          className="rounded-t-3xl bg-white px-6 pt-6"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
          {/* Handle bar */}
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-slate-300" />

          {submitted ? (
            <View className="items-center py-8">
              <Ionicons name="checkmark-circle" size={64} color="#3CB4A0" />
              <Text className="mt-4 text-lg font-bold text-brand-navy">Thank You!</Text>
              <Text className="mt-1 text-sm text-brand-muted">
                Your feedback helps improve network quality.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-1 text-xl font-bold text-brand-navy">Rate Your Experience</Text>
              <Text className="mb-6 text-sm text-brand-muted">
                How was your network quality during this session?
              </Text>

              {error ? (
                <View className="mb-4 rounded-2xl bg-red-50 p-3">
                  <Text className="text-sm font-medium text-red-700">{error}</Text>
                </View>
              ) : null}

              <StarRating
                label="Overall Satisfaction"
                value={overallRating}
                onChange={setOverallRating}
              />
              <StarRating
                label="Speed"
                value={speedRating}
                onChange={setSpeedRating}
              />
              <StarRating
                label="Delay / Latency"
                value={delayRating}
                onChange={setDelayRating}
              />
              <StarRating
                label="Reliability"
                value={reliabilityRating}
                onChange={setReliabilityRating}
              />

              <Text className="mb-2 text-sm font-semibold text-brand-navy">
                Additional Comments (optional)
              </Text>
              <TextInput
                className="mb-6 rounded-2xl bg-brand-light-blue px-4 py-3 text-sm text-brand-navy"
                placeholder="Tell us more about your experience..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />

              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleLater}
                  className="flex-1 items-center rounded-2xl bg-slate-100 px-6 py-3.5 active:opacity-70">
                  <Text className="text-sm font-bold text-brand-navy">Later</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  className={`flex-1 items-center rounded-2xl px-6 py-3.5 active:opacity-70 ${
                    submitting ? 'bg-brand-teal/50' : 'bg-brand-teal'
                  }`}>
                  <Text className="text-sm font-bold text-white">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
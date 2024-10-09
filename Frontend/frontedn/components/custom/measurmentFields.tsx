import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface MeasurementValue {
  value: string;
  unit: string;
  feet?: string;
  inches?: string;
}

interface MeasurementFieldProps {
  label: string;
  measurement: MeasurementValue;
  units: string[];
  onMeasurementChange: (value: string, unit: string, field?: 'feet' | 'inches') => void;
}

const MeasurementField: React.FC<MeasurementFieldProps> = ({
  label,
  measurement,
  units,
  onMeasurementChange,
}) => {
  const { colors } = useTheme();
  const isFeet = measurement.unit === 'ft' || measurement.unit === 'in';

  const RadioButton: React.FC<{ label: string; selected: boolean; onSelect: () => void }> = ({
    label,
    selected,
    onSelect,
  }) => (
    <TouchableOpacity style={styles.radioButton} onPress={onSelect}>
      <View style={[styles.radioCircle, selected && { borderColor: colors.primary }]}>
        {selected && <View style={[styles.selectedRb, { backgroundColor: colors.primary }]} />}
      </View>
      <Text style={[styles.radioText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.inputContainer}>
        {isFeet && label === 'Height' ? (
          <>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 1 }]}
              value={measurement.feet}
              onChangeText={(value) => onMeasurementChange(value, 'ft', 'feet')}
              keyboardType="numeric"
              placeholder="Feet"
              placeholderTextColor={colors.text}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 1, marginLeft: 10 }]}
              value={measurement.inches}
              onChangeText={(value) => onMeasurementChange(value, 'ft', 'inches')}
              keyboardType="numeric"
              placeholder="Inches"
              placeholderTextColor={colors.text}
            />
          </>
        ) : (
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 2 }]}
            value={measurement.value}
            onChangeText={(value) => onMeasurementChange(value, measurement.unit)}
            keyboardType="numeric"
            placeholder="Value"
            placeholderTextColor={colors.text}
          />
        )}
      </View>
      <View style={styles.radioButtonContainer}>
        {units.map((unit) => (
          <RadioButton
            key={unit}
            label={unit}
            selected={measurement.unit === unit}
            onSelect={() => onMeasurementChange(measurement.value, unit)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioText: {
    marginLeft: 5,
  },
});

export default MeasurementField;
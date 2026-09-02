import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';

type ImageSource = 'camera' | 'gallery' | 'both';
type CameraType = 'front' | 'back';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;

  // Selected image response
  onChange: (response: ImagePickerResponse) => void;

  // camera / gallery / both
  source?: ImageSource;

  // front / back camera
  cameraType?: CameraType;
}

const ImagePickerModal = ({
  visible,
  onClose,
  onChange,
  source = 'both',
  cameraType = 'back',
}: ImagePickerModalProps) => {

  const handleCamera = async () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      cameraType: cameraType,
      quality: 0.8,
    };

    const response = await launchCamera(options);

    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert(
        'Error',
        response.errorMessage || 'Something went wrong',
      );
      return;
    }

    onChange(response);
    onClose();
  };

  const handleGallery = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    };

    const response = await launchImageLibrary(options);

    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert(
        'Error',
        response.errorMessage || 'Something went wrong',
      );
      return;
    }

    onChange(response);
    onClose();
  };

  const showCamera = source === 'camera' || source === 'both';
  const showGallery = source === 'gallery' || source === 'both';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>

        <View style={styles.container}>

          <Text style={styles.title}>
            Select Image
          </Text>

          {showCamera && (
            <TouchableOpacity
              style={styles.option}
              onPress={handleCamera}
            >
              <Text style={styles.icon}>📷</Text>

              <Text style={styles.optionText}>
                Take Photo
              </Text>
            </TouchableOpacity>
          )}

          {showGallery && (
            <TouchableOpacity
              style={styles.option}
              onPress={handleGallery}
            >
              <Text style={styles.icon}>🖼️</Text>

              <Text style={styles.optionText}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    </Modal>
  );
};

export default ImagePickerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },

  option: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  icon: {
    fontSize: 22,
    marginRight: 15,
  },

  optionText: {
    fontSize: 16,
    color: '#222',
  },

  cancelButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'red',
  },
});
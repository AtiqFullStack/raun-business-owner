import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import KeyboardWrapper from '../components/KeyboardWrapper';
import CommonHeader from '../components/CommonHeader';
import { useOwnerNotifications } from '../store/useOwnerNotifications';
import { openDemandNotification } from '../services/demandNotificationNavigation';
export default function OwnerNotifications() {
  const items = useOwnerNotifications(state => state.items);
  return (
    <KeyboardWrapper>
      <CommonHeader title="Notifications" />
      <FlatList
        data={items}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => openDemandNotification(item)}
            style={styles.card}
          >
            <Text style={styles.title}>
              {item.title || 'Service booking update'}
            </Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>
              {new Date(item.receivedAt).toLocaleString()}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.body}>
              New booking updates will appear here.
            </Text>
          </View>
        }
      />
    </KeyboardWrapper>
  );
}
const styles = StyleSheet.create({
  list: { padding: 18, paddingBottom: 110, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#DFEEE7',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  title: { color: '#164C48', fontSize: 14, fontWeight: '700' },
  body: { color: '#7B8C81', fontSize: 12, lineHeight: 19 },
  time: { color: '#99A59D', fontSize: 10 },
  empty: { alignItems: 'center', paddingVertical: 80 },
});

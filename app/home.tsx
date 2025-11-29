import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AdBanner } from '../src/components/ui/AdBanner';

export default function Home() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Modern Snake</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/game')}>
                <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.shopButton]} onPress={() => router.push('/shop')}>
                <Text style={styles.buttonText}>Skin Shop</Text>
            </TouchableOpacity>
            <AdBanner />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 48,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 50,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        marginBottom: 20,
    },
    shopButton: {
        backgroundColor: '#2196F3',
    },
    buttonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

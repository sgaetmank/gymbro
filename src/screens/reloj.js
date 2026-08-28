import { useEffect, useState } from 'react';

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import UserBottomNav from '../components/UserBottomNav';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function StopwatchScreen({ navigation }) {
	const { width, isLandscape } = useResponsiveLayout();
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isRunning, setIsRunning] = useState(false);

    /* useEffect se ejecuta cuando ocurre algun cambio en el componente isRunning */
	useEffect(() => {
        /* si se esta ejecutando, no modifica nada */
		if (!isRunning) {
			return undefined;
		}

        /* setInterval definido con 1000 hace que la funcion setElapsedTime se ejecute cada segundo, agregando un seg a elapsedTime */
		const interval = setInterval(() => {
			setElapsedTime((currentTime) => currentTime + 1000);
		}, 1000);

		return () => clearInterval(interval); /* cuando isRunning es false se frena la ejecucuin del intervalo cada 1 segundo */
	}, [isRunning]);

	const minutes = Math.floor(elapsedTime / 60000);
	const seconds = Math.floor((elapsedTime % 60000) / 1000);

	const formatTime = (time) => String(time).padStart(2, '0');

	return (
		<SafeAreaView style={styles.container}>
			<View
				style={[
					styles.header,
					isLandscape && styles.headerLandscape,
				]}
			>
				<Text style={styles.headerTitle}>
					Reloj
				</Text>
			</View>

			<View
				style={[
					styles.content,
					isLandscape && styles.contentLandscape,
				]}
			>

					<View style={[styles.timerCard, width < 360 && styles.timerCardSmall]}>
						<Text
							style={[
								styles.timer,
								width < 360 && styles.timerSmall,
								isLandscape && styles.timerLandscape,
							]}
						>
							{formatTime(minutes)}:{formatTime(seconds)}
					</Text>

					<View style={styles.buttons}>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={() => setIsRunning((running) => !running)}
						>
							<Text style={styles.primaryButtonText}>
								{isRunning ? 'Pausar' : 'Iniciar'}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={() => {
								setIsRunning(false);
								setElapsedTime(0);
							}}
						>
							<Text style={styles.secondaryButtonText}>
								Reiniciar
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>

			<UserBottomNav
				activeScreen="clock"
				isLandscape={isLandscape}
				navigation={navigation}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#101010',
	},

	header: {
		minHeight: '7%',
		paddingVertical: '1.5%',
		backgroundColor: '#1D1D1D',
		justifyContent: 'center',
		paddingHorizontal: '4%',
	},

	headerTitle: {
		color: '#FFFFFF',
		fontSize: 13,
		fontWeight: '500',
	},

	headerLandscape: {
		paddingHorizontal: 24,
		minHeight: 56,
	},

	content: {
		flex: 1,
		paddingHorizontal: '2.5%',
		justifyContent: 'center',
	},

	contentLandscape: {
		width: '100%',
		maxWidth: 1000,
		alignSelf: 'center',
		paddingHorizontal: 24,
	},

	title: {
		color: '#FFFFFF',
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 16,
	},

	timerCard: {
		width: '100%',
		maxWidth: 520,
		backgroundColor: '#1D1D1D',
		borderRadius: 8,
		alignItems: 'center',
		alignSelf: 'center',
		padding: 24,
	},

	timerCardSmall: {
		padding: 18,
	},

	timer: {
		color: '#FFC107',
		fontSize: 42,
		fontWeight: '700',
		letterSpacing: 1,
		marginBottom: 24,
	},

	timerSmall: {
		fontSize: 36,
	},

	timerLandscape: {
		fontSize: 38,
	},

	buttons: {
		width: '100%',
		flexDirection: 'row',
		gap: 10,
	},

	primaryButton: {
		flex: 1,
		minHeight: 48,
		backgroundColor: '#FFC107',
		borderRadius: 7,
		alignItems: 'center',
		justifyContent: 'center',
	},

	primaryButtonText: {
		color: '#111111',
		fontSize: 14,
		fontWeight: '700',
	},

	secondaryButton: {
		flex: 1,
		minHeight: 48,
		backgroundColor: '#292929',
		borderRadius: 7,
		alignItems: 'center',
		justifyContent: 'center',
	},

	secondaryButtonText: {
		color: '#FFFFFF',
		fontSize: 14,
		fontWeight: '700',
	},
});

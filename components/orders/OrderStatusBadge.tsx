import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BadgeIcon = React.ComponentProps<typeof Ionicons>["name"];

type OrderStatusBadgeProps = {
	label: string;
	accent: string;
	icon?: BadgeIcon;
};

export default function OrderStatusBadge({
	label,
	accent,
	icon = "time-outline",
}: OrderStatusBadgeProps) {
	return (
		<View
			style={[
				styles.wrap,
				{ backgroundColor: `${accent}1A`, borderColor: `${accent}40` },
			]}
		>
			<Ionicons name={icon} size={12} color={accent} />
			<Text style={[styles.label, { color: accent }]}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		borderWidth: 1,
		alignSelf: "flex-start",
	},
	label: {
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 0.9,
		textTransform: "uppercase",
	},
});


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
				{ backgroundColor: `${accent}1A`, borderColor: `${accent}20` },
			]}
		>
			<Ionicons name={icon} size={12} color={accent} />
			<Text style={[styles.label]}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 999,
	//	borderWidth: 1,
		alignSelf: "flex-start",
	},
	label: {
		fontSize:9,
		fontWeight: "500",
		letterSpacing: 0.7,
		textTransform: "uppercase",
		color:"#fff"
	},
});


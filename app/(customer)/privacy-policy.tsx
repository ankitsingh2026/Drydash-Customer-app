import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function PrivacyPolicy() {
    const { theme } = useTheme();
    const router = useRouter();

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {title}
            </Text>
            <Text style={[styles.sectionText, { color: theme.subText }]}>
                {children}
            </Text>
        </View>
    );

    const BulletPoint = ({ children }: { children: string }) => (
        <View style={styles.bulletContainer}>
            <Text style={[styles.bullet, { color: theme.primary || theme.text }]}>•</Text>
            <Text style={[styles.bulletText, { color: theme.subText }]}>{children}</Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={theme.background === "#FFFFFF" ? "dark-content" : "light-content"}
                backgroundColor={theme.background}
            />

            {/* Header with Back Button */}
            <View style={[styles.headerContainer, {
                backgroundColor: theme.background,
                borderBottomColor: theme.border || theme.card,
            }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={theme.text}
                    />
                </TouchableOpacity>

                <View style={styles.headerTextContainer}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        Privacy Policy
                    </Text>
                </View>

                {/* Placeholder for symmetry */}
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Last Updated Badge */}
                <View style={[styles.updateBadge, { backgroundColor: theme.card }]}>
                    <Ionicons
                        name="time-outline"
                        size={16}
                        color={theme.subText}
                        style={styles.badgeIcon}
                    />
                    <Text style={[styles.lastUpdated, { color: theme.subText }]}>
                        Last updated: January 2026
                    </Text>
                </View>

                {/* Introduction Card */}
                <View style={[styles.introCard, {
                    backgroundColor: theme.card,
                    borderColor: theme.border || theme.card,
                }]}>
                    <View style={styles.iconHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" || theme.card }]}>
                            <Ionicons
                                name="shield-checkmark"
                                size={24}
                                color={theme.primary || theme.text}
                            />
                        </View>
                    </View>

                    <Text style={[styles.introText, { color: theme.subText }]}>
                        Drydash ("we", "our", or "us") respects your privacy and is committed to
                        protecting the personal information you share with us. This Privacy Policy
                        explains how we collect, use, disclose, and safeguard your information when
                        you use our mobile application, website, or services related to shoe spa,
                        cloud washing, and onsite cleaning services.
                    </Text>

                    <View style={[styles.divider, { backgroundColor: theme.border || theme.background }]} />

                    <Text style={[styles.introText, { color: theme.subText }]}>
                        By accessing or using Drydash services, you agree to the collection and use
                        of information in accordance with this Privacy Policy.
                    </Text>
                </View>

                {/* Sections */}
                <View style={styles.sectionsContainer}>
                    <Section title="1. Information We Collect">
                        We may collect the following types of information:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            Personal Information: Name, phone number, email address, delivery address,
                            and payment-related details when you place an order.
                        </BulletPoint>
                        <BulletPoint>
                            Location Information: To provide accurate pickup and drop-off services,
                            including onsite cleaning.
                        </BulletPoint>
                        <BulletPoint>
                            Order Information: Service type, shoe details, pickup schedule, and order
                            history.
                        </BulletPoint>
                        <BulletPoint>
                            Device Information: Device type, operating system, IP address, and app
                            usage data for improving app performance.
                        </BulletPoint>
                    </View>

                    <Section title="2. How We Use Your Information">
                        We use the collected information to:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            Provide and manage shoe spa, cloud washing, and onsite services.
                        </BulletPoint>
                        <BulletPoint>
                            Schedule pickups, deliveries, and service appointments.
                        </BulletPoint>
                        <BulletPoint>
                            Process payments and send order confirmations.
                        </BulletPoint>
                        <BulletPoint>
                            Communicate updates, offers, and service-related notifications.
                        </BulletPoint>
                        <BulletPoint>
                            Improve our services, app experience, and customer support.
                        </BulletPoint>
                        <BulletPoint>
                            Ensure safety, prevent fraud, and comply with legal requirements.
                        </BulletPoint>
                    </View>

                    <Section title="3. Sharing of Information">
                        Drydash does not sell your personal data. We may share your information only
                        in the following situations:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            With service partners and delivery personnel solely to complete your order.
                        </BulletPoint>
                        <BulletPoint>
                            With payment gateways to securely process transactions.
                        </BulletPoint>
                        <BulletPoint>
                            With legal authorities if required by law or to protect our rights.
                        </BulletPoint>
                    </View>

                    <Section title="4. Data Security">
                        We implement appropriate technical and organizational security measures to
                        protect your personal information against unauthorized access, alteration,
                        disclosure, or destruction. However, no method of transmission over the
                        internet is 100% secure, and we cannot guarantee absolute security.
                    </Section>

                    <Section title="5. Data Retention">
                        We retain your information only for as long as necessary to fulfill the
                        purposes outlined in this policy, comply with legal obligations, resolve
                        disputes, and enforce agreements.
                    </Section>

                    <Section title="6. Your Rights">
                        You have the right to:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            Access and review your personal information.
                        </BulletPoint>
                        <BulletPoint>
                            Request corrections to inaccurate data.
                        </BulletPoint>
                        <BulletPoint>
                            Request deletion of your data, subject to legal requirements.
                        </BulletPoint>
                        <BulletPoint>
                            Opt out of promotional communications.
                        </BulletPoint>
                    </View>

                    <Section title="7. Third-Party Services">
                        Our app may use third-party services such as maps, analytics, or payment
                        providers. These third parties have their own privacy policies, and Drydash
                        is not responsible for their practices.
                    </Section>

                    <Section title="8. Children's Privacy">
                        Drydash services are not intended for children under the age of 13. We do not
                        knowingly collect personal information from children.
                    </Section>

                    <Section title="9. Changes to This Policy">
                        We may update this Privacy Policy from time to time. Any changes will be
                        reflected on this page, and continued use of our services indicates your
                        acceptance of the updated policy.
                    </Section>

                    <Section title="10. Contact Us">
                        If you have any questions or concerns about this Privacy Policy or our data
                        practices, please contact us through the Drydash app or official support
                        channels.
                    </Section>
                </View>

                {/* Footer Card */}
                <View style={[styles.footer, {
                    backgroundColor: theme.card,
                    borderColor: theme.primary || theme.border,
                }]}>
                    <View style={styles.footerIconContainer}>
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={theme.primary || theme.text}
                        />
                    </View>
                    <Text style={[styles.footerText, { color: theme.subText }]}>
                        Thank you for trusting Drydash with your information. We're committed to
                        keeping your data safe and secure.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,

    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    updateBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeIcon: {
        marginRight: 6,
    },
    lastUpdated: {
        fontSize: 12,
        fontWeight: "600",
    },
    introCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    iconHeader: {
        marginBottom: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    introText: {
        fontSize: 14,
        lineHeight: 22,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    sectionsContainer: {
        marginTop: 8,
    },
    section: {
        marginTop: 24,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    sectionText: {
        fontSize: 14,
        lineHeight: 22,
    },
    bulletList: {
        marginLeft: 4,
        marginTop: 8,
        marginBottom: 8,
    },
    bulletContainer: {
        flexDirection: "row",
        marginBottom: 12,
        paddingRight: 8,
    },
    bullet: {
        fontSize: 18,
        marginRight: 12,
        fontWeight: "700",
        marginTop: -2,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
    },
    footer: {
        marginTop: 32,
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
        flexDirection: "row",
        alignItems: "flex-start",
    },
    footerIconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    footerText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
    },
});

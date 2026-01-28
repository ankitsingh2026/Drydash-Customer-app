import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Terms() {
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
                        Terms & Conditions
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
                                name="document-text" 
                                size={24} 
                                color={theme.primary || theme.text} 
                            />
                        </View>
                    </View>
                    
                    <Text style={[styles.introText, { color: theme.subText }]}>
                        Welcome to Drydash! These Terms and Conditions ("Terms") govern your use of 
                        our mobile application, website, and services for shoe spa, cloud washing, 
                        and onsite cleaning services. By accessing or using Drydash, you agree to 
                        be bound by these Terms.
                    </Text>
                    
                    <View style={[styles.divider, { backgroundColor: theme.border || theme.background }]} />
                    
                    <Text style={[styles.introText, { color: theme.subText }]}>
                        Please read these Terms carefully before using our services. If you do not 
                        agree with any part of these Terms, you should not use Drydash.
                    </Text>
                </View>

                {/* Sections */}
                <View style={styles.sectionsContainer}>
                    <Section title="1. Acceptance of Terms">
                        By creating an account, placing an order, or using any of our services, you 
                        acknowledge that you have read, understood, and agree to be bound by these 
                        Terms and our Privacy Policy. These Terms constitute a legally binding 
                        agreement between you and Drydash.
                    </Section>

                    <Section title="2. Services Offered">
                        Drydash provides the following services:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            Shoe Spa Services: Professional cleaning, restoration, and care for all 
                            types of footwear.
                        </BulletPoint>
                        <BulletPoint>
                            Cloud Washing: Advanced laundry and dry cleaning services with pickup 
                            and delivery.
                        </BulletPoint>
                        <BulletPoint>
                            Onsite Cleaning: Professional cleaning services at your preferred location.
                        </BulletPoint>
                    </View>

                    <Section title="3. User Accounts">
                        To use our services, you must:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            Be at least 18 years old or have parental/guardian consent.
                        </BulletPoint>
                        <BulletPoint>
                            Provide accurate, current, and complete information during registration.
                        </BulletPoint>
                        <BulletPoint>
                            Maintain the security of your account credentials.
                        </BulletPoint>
                        <BulletPoint>
                            Notify us immediately of any unauthorized use of your account.
                        </BulletPoint>
                        <BulletPoint>
                            Be responsible for all activities under your account.
                        </BulletPoint>
                    </View>

                    <Section title="4. Ordering and Payments">
                        When placing an order through Drydash:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            All prices are displayed in local currency and may be subject to change.
                        </BulletPoint>
                        <BulletPoint>
                            Payment must be completed before service delivery unless otherwise arranged.
                        </BulletPoint>
                        <BulletPoint>
                            We accept various payment methods including credit/debit cards, digital 
                            wallets, and cash on delivery where available.
                        </BulletPoint>
                        <BulletPoint>
                            You are responsible for providing accurate payment information.
                        </BulletPoint>
                        <BulletPoint>
                            All sales are final unless otherwise stated in our refund policy.
                        </BulletPoint>
                    </View>

                    <Section title="5. Service Delivery">
                        Regarding pickups and deliveries:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            We will make reasonable efforts to meet scheduled pickup and delivery times.
                        </BulletPoint>
                        <BulletPoint>
                            Delivery times are estimates and may vary due to unforeseen circumstances.
                        </BulletPoint>
                        <BulletPoint>
                            You must be available or designate someone to hand over items during pickup.
                        </BulletPoint>
                        <BulletPoint>
                            We are not liable for delays caused by weather, traffic, or other external factors.
                        </BulletPoint>
                        <BulletPoint>
                            You will be notified of any significant delays or changes to your schedule.
                        </BulletPoint>
                    </View>

                    <Section title="6. Item Care and Liability">
                        Drydash takes utmost care with your items. However:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            We are not liable for pre-existing damage, wear and tear, or manufacturing defects.
                        </BulletPoint>
                        <BulletPoint>
                            High-value items should be declared at the time of service booking.
                        </BulletPoint>
                        <BulletPoint>
                            Our liability is limited to the declared value or actual value of the item, 
                            whichever is lower.
                        </BulletPoint>
                        <BulletPoint>
                            Claims must be reported within 24 hours of delivery with photographic evidence.
                        </BulletPoint>
                        <BulletPoint>
                            We reserve the right to refuse service for items we deem unsuitable or unsafe.
                        </BulletPoint>
                    </View>

                    <Section title="7. Cancellations and Refunds">
                        Our cancellation and refund policy:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            Orders can be cancelled up to 2 hours before scheduled pickup for a full refund.
                        </BulletPoint>
                        <BulletPoint>
                            Cancellations after pickup may be subject to partial charges for work completed.
                        </BulletPoint>
                        <BulletPoint>
                            Refunds will be processed within 5-7 business days to the original payment method.
                        </BulletPoint>
                        <BulletPoint>
                            We reserve the right to refuse service or cancel orders in case of suspicious activity.
                        </BulletPoint>
                    </View>

                    <Section title="8. Prohibited Activities">
                        You agree not to:
                    </Section>
                    <View style={styles.bulletList}>
                        <BulletPoint>
                            Use the service for any illegal or unauthorized purpose.
                        </BulletPoint>
                        <BulletPoint>
                            Provide false or misleading information.
                        </BulletPoint>
                        <BulletPoint>
                            Interfere with the proper functioning of the app or services.
                        </BulletPoint>
                        <BulletPoint>
                            Harass, abuse, or harm our staff or other users.
                        </BulletPoint>
                        <BulletPoint>
                            Attempt to reverse engineer or copy any part of our platform.
                        </BulletPoint>
                    </View>

                    <Section title="9. Intellectual Property">
                        All content, trademarks, logos, and intellectual property on the Drydash 
                        platform are owned by or licensed to us. You may not use, reproduce, or 
                        distribute any content without our express written permission.
                    </Section>

                    <Section title="10. Limitation of Liability">
                        To the maximum extent permitted by law, Drydash shall not be liable for any 
                        indirect, incidental, special, consequential, or punitive damages resulting 
                        from your use or inability to use our services. Our total liability shall not 
                        exceed the amount paid for the specific service in question.
                    </Section>

                    <Section title="11. Indemnification">
                        You agree to indemnify and hold harmless Drydash, its officers, directors, 
                        employees, and agents from any claims, damages, losses, or expenses arising 
                        from your violation of these Terms or misuse of our services.
                    </Section>

                    <Section title="12. Changes to Terms">
                        We reserve the right to modify these Terms at any time. Changes will be 
                        effective immediately upon posting. Your continued use of Drydash after 
                        changes constitutes acceptance of the modified Terms. We will notify you of 
                        significant changes via email or app notification.
                    </Section>

                    <Section title="13. Termination">
                        We may suspend or terminate your account at our discretion if you violate 
                        these Terms or engage in fraudulent, abusive, or illegal activity. Upon 
                        termination, your right to use the services will immediately cease.
                    </Section>

                    <Section title="14. Dispute Resolution">
                        Any disputes arising from these Terms or our services shall be resolved 
                        through binding arbitration in accordance with local laws. You waive your 
                        right to participate in class action lawsuits or class-wide arbitration.
                    </Section>

                    <Section title="15. Governing Law">
                        These Terms shall be governed by and construed in accordance with the laws 
                        of the jurisdiction in which Drydash operates, without regard to conflict 
                        of law principles.
                    </Section>

                    <Section title="16. Severability">
                        If any provision of these Terms is found to be invalid or unenforceable, 
                        the remaining provisions shall continue in full force and effect.
                    </Section>

                    <Section title="17. Contact Information">
                        For questions, concerns, or support regarding these Terms or our services, 
                        please contact us through the Drydash app or visit our official support 
                        channels. We aim to respond to all inquiries within 24-48 hours.
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
                        Thank you for choosing Drydash. We're committed to providing you with 
                        excellent service while maintaining transparency and fairness.
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
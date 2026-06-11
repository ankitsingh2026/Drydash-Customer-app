import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Content ──────────────────────────────────────────────────────────────────
type BulletItem = { label?: string; text: string };

type SectionData = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    intro?: string;
    bullets?: BulletItem[];
};

const SECTIONS: SectionData[] = [
    {
        icon: "document-text-outline",
        title: "Information We Collect",
        intro:
            "To provide our premium DryDash service, we gather essential information that allows us to manage your dry cleaning needs efficiently.",
        bullets: [
            { label: "Identity Data", text: "Full name, profile photo, and unique identifier." },
            { label: "Contact Information", text: "Residential address and verified phone number." },
            { label: "Transaction Data", text: "Encrypted payment tokens and detailed order history." },
        ],
    },
    {
        icon: "swap-horizontal-outline",
        title: "How We Use Your Information",
        intro:
            "Your data enables us to provide a seamless, personalized experience from pickup to drop-off.",
        bullets: [
            { label: "Service Delivery", text: "Managing orders, routing drivers, and processing payments." },
            { label: "Communication", text: "Sending real-time order updates and customer support responses." },
        ],
    },
    {
        icon: "share-social-outline",
        title: "Sharing of Information",
        intro:
            "We do not sell your personal data. We only share information with vetted partners necessary for operation.",
    },
    {
        icon: "shield-outline",
        title: "Data Security",
        intro:
            "We employ enterprise-grade encryption (AES-256) and secure socket layers (SSL) to protect your data. Regular security audits ensure your information remains shielded.",
    },

    
    // {
    //     icon: "time-outline",
    //     title: "Data Retention",
    //     intro:
    //         "We retain your information only for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce agreements.",
    // },
    // {
    //     icon: "person-outline",
    //     title: "Your Rights",
    //     intro: "You have the right to:",
    //     bullets: [
    //         { text: "Access and review your personal information." },
    //         { text: "Request corrections to inaccurate data." },
    //         { text: "Request deletion of your data, subject to legal requirements." },
    //         { text: "Opt out of promotional communications." },
    //     ],
    // },
    // {
    //     icon: "globe-outline",
    //     title: "Third-Party Services",
    //     intro:
    //         "Our app may use third-party services such as maps, analytics, or payment providers. These third parties have their own privacy policies, and DryDash is not responsible for their practices.",
    // },
    // {
    //     icon: "happy-outline",
    //     title: "Children's Privacy",
    //     intro:
    //         "DryDash services are not intended for children under the age of 13. We do not knowingly collect personal information from children.",
    // },
    {
        icon: "refresh-outline",
        title: "Changes to This Policy",
        intro:
            "We may update this Privacy Policy from time to time. Any changes will be reflected on this page, and continued use of our services indicates your acceptance of the updated policy.",
    },
];
// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({
    section,
    colors,
}: {
    section: SectionData;
    colors: ReturnType<typeof buildColors>;
}) {
    return (
        <View style={[styles.sectionCard, { backgroundColor:  "#052B2599", borderColor: colors.border }]}>
            {/* Icon + Title row */}
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
                    <Ionicons name={section.icon} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            </View>

            {section.intro ? (
                <Text style={[styles.sectionIntro, { color: "#fff" }]}>{section.intro}</Text>
            ) : null}

            {section.bullets?.map((b, i) => (
                <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.bulletText, { color: "#fff" }]}>
                        {b.label ? (
                            <>
                                <Text style={[styles.bulletLabel, { color: colors.text }]}>{b.label}: </Text>
                                {b.text}
                            </>
                        ) : (
                            b.text
                        )}
                    </Text>
                </View>
            ))}
        </View>
    );
}

function buildColors(theme: any) {
    return {
        bg: theme.background,
        card: theme.card,
        border: theme.border || "#0E3A2F",
        primary: theme.primary,
        primarySoft: `${theme.primary}22`,
        text: theme.text,
        subText: theme.subText,
        gradientA: theme.gradient?.[0] ?? theme.primary,
        gradientB: theme.gradient?.[1] ?? theme.primary,
        gradientC: theme.gradient?.[2] ?? theme.primary,
    };
}

export default function PrivacyPolicy() {
    const { theme } = useTheme();
    const router = useRouter();
    const colors = buildColors(theme);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

            {/* ── Header ── */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* ── Last Updated Badge ── */}
                <View style={[styles.badge, { backgroundColor:  "#052B2599" }]}>
                    <Ionicons name="time-outline" size={13} color={"#fff"} />
                    <Text style={[styles.badgeText, { color: "#fff" }]}>Last updated: January 2026</Text>
                </View>

                {/* ── Hero ── */}
                <View style={[styles.hero, { borderColor: colors.border, backgroundColor:  "#052B2599" }]} >
                    <View style={[styles.heroIconWrap, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>Your Privacy Matters</Text>
                    <Text style={[styles.heroText, { color: "#fff" }]}>
                        We value your trust and are committed to protecting your personal information with artisanal precision.
                    </Text>
                </View>


                {/* ── Section Cards ── */}
                <View style={styles.cardList}>
                    {SECTIONS.map((s) => (
                        <SectionCard key={s.title} section={s} colors={colors} />
                    ))}
                </View>

                {/* ── Contact Card ── */}
                <View style={[styles.contactCard, { backgroundColor:  "#052B2599", borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconWrap, { backgroundColor: "#052B2599", borderColor: colors.border }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
                    </View>
                    <Text style={[styles.sectionIntro, { color: "#fff" }]}>
                        For any privacy-related inquiries, contact our Data Protection Officer:
                    </Text>
                    <TouchableOpacity
                        onPress={() => Linking.openURL("mailto:privacy@drydash.luxury")}
                        activeOpacity={0.75}
                    >
                        <Text style={[styles.emailLink, { color: colors.primary }]}>support@drydash.in</Text>
                    </TouchableOpacity>
                    <Text style={[styles.addressText, { color: "#fff" }]}>
                       Tower 15211 ats le grandiose sector 150 noida , 201310
                    </Text>
                </View>

                {/* ── Footer ── */}
                <View style={[styles.footer, { backgroundColor: "#052B2599", borderColor: colors.primary }]}>
                    <View style={[styles.footerIconWrap, { backgroundColor: colors.primarySoft }]}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.footerText, { color: "#fff" }]}>
                        Thank you for trusting DryDash with your information. We're committed to keeping your data safe and secure.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },

    // header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "android" ? 10 : 0,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
      
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 0.2,
    },
    headerSpacer: { width: 40 },

    // scroll
    content: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 16 },

    // badge
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        marginBottom: 16,
    },
    badgeText: { fontSize: 12, fontWeight: "600" },

    // hero
    hero: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 24,
        alignItems: "center",
        marginBottom: 14,
    },
    heroIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 10,
        letterSpacing: 0.2,
    },
    heroText: {
        fontSize: 14,
        lineHeight: 22,
        textAlign: "center",
        fontWeight: "500",
    },

    // intro card
    introCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
    },
    introText: { fontSize: 13, lineHeight: 21, fontWeight: "500" },
    divider: { height: 1, marginVertical: 14 },

    // section cards
    cardList: { gap: 12 },
    sectionCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    sectionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "900",
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    sectionIntro: {
        fontSize: 13,
        lineHeight: 21,
        fontWeight: "500",
        marginBottom: 6,
    },

    // bullets
    bulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginTop: 10,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 3,
    },
    bulletText: { flex: 1, fontSize: 13, lineHeight: 21, fontWeight: "500" },
    bulletLabel: { fontWeight: "800" },

    // contact card
    contactCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        marginTop: 12,
    },
    emailLink: {
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 0.2,
        marginBottom: 6,
        textDecorationLine: "underline",
    },
    addressText: {
        fontSize: 12,
        fontWeight: "500",
        lineHeight: 18,
    },

    // footer
    footer: {
        marginTop: 16,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    footerIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 1,
    },
    footerText: { flex: 1, fontSize: 13, lineHeight: 21, fontWeight: "500" },
});

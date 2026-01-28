import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface FAQItem {
    id: number;
    question: string;
    answer: string;
}

export default function Support() {
    const { theme } = useTheme();
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const faqs: FAQItem[] = [
        {
            id: 1,
            question: "How do I track my order?",
            answer: "You can track your order in real-time by going to the 'Orders' section in the app. Click on your active order to see the current status, estimated delivery time, and live location of our delivery personnel. You'll also receive push notifications at each stage of your order."
        },
        {
            id: 2,
            question: "What is your cancellation policy?",
            answer: "Orders can be cancelled up to 2 hours before the scheduled pickup for a full refund. If cancelled after pickup, charges may apply for work already completed. Refunds are processed within 5-7 business days to your original payment method."
        },
        {
            id: 3,
            question: "How long does the cleaning process take?",
            answer: "Shoe spa services typically take 24-48 hours, cloud washing takes 2-3 days, and onsite cleaning is completed on the same day. Express services are available for urgent needs at an additional cost. You'll receive updates throughout the process."
        },
        {
            id: 4,
            question: "What payment methods do you accept?",
            answer: "We accept credit/debit cards (Visa, Mastercard, Amex), UPI payments, digital wallets (Paytm, PhonePe, Google Pay), net banking, and cash on delivery for select services. All payments are secure and encrypted."
        },
        {
            id: 5,
            question: "What if my items are damaged during service?",
            answer: "We take utmost care with your items. In the rare event of damage, please report it within 24 hours with photos through the app. Our team will review your claim and provide compensation up to the declared or actual value of the item, whichever is lower."
        },
        {
            id: 6,
            question: "Do you offer pickup and delivery services?",
            answer: "Yes! We offer free pickup and delivery for all our services within our service area. You can schedule a convenient time slot during checkout. Our delivery personnel will contact you 30 minutes before arrival."
        },
        {
            id: 7,
            question: "How do I get a refund?",
            answer: "To request a refund, go to your order history, select the order, and tap 'Request Refund'. Provide a reason and any necessary details. Our support team will review your request within 24 hours. Approved refunds are processed within 5-7 business days."
        }
    ];

    const toggleFAQ = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleCall = () => {
        Linking.openURL('tel:+1234567890');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@drydash.com');
    };

    const handleChat = () => {
        console.log('Open chat');
    };

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
                        Support Center
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
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" || theme.card }]}>
                        <Ionicons 
                            name="headset" 
                            size={32} 
                            color={theme.primary || theme.text} 
                        />
                    </View>
                    <Text style={[styles.headerSubtitle, { color: theme.subText }]}>
                        We're here to help you 24/7
                    </Text>
                    <Text style={[styles.headerDescription, { color: theme.subText }]}>
                        Find answers to common questions or reach out to our support team
                    </Text>
                </View>

                {/* FAQ Section */}
                <View style={styles.faqSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons 
                            name="help-circle" 
                            size={20} 
                            color={theme.text} 
                        />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Frequently Asked Questions
                        </Text>
                    </View>

                    {faqs.map((faq) => (
                        <View 
                            key={faq.id} 
                            style={[
                                styles.faqItem,
                                { 
                                    backgroundColor: theme.card,
                                    borderColor: theme.border || theme.card,
                                }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.faqQuestion}
                                onPress={() => toggleFAQ(faq.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.questionLeft}>
                                    <View style={[styles.questionNumber, { 
                                        backgroundColor: theme.primary + "20" || theme.background 
                                    }]}>
                                        <Text style={[styles.questionNumberText, { 
                                            color: theme.primary || theme.text 
                                        }]}>
                                            {faq.id}
                                        </Text>
                                    </View>
                                    <Text style={[styles.questionText, { color: theme.text }]}>
                                        {faq.question}
                                    </Text>
                                </View>
                                <Ionicons 
                                    name={expandedId === faq.id ? "chevron-up" : "chevron-down"} 
                                    size={20} 
                                    color={theme.subText} 
                                />
                            </TouchableOpacity>
                            
                            {expandedId === faq.id && (
                                <View style={styles.faqAnswer}>
                                    <View style={[styles.answerDivider, { 
                                        backgroundColor: theme.border || theme.background 
                                    }]} />
                                    <Text style={[styles.answerText, { color: theme.subText }]}>
                                        {faq.answer}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Contact Section */}
                <View style={styles.contactSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons 
                            name="chatbubbles" 
                            size={20} 
                            color={theme.text} 
                        />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Still Need Help?
                        </Text>
                    </View>
                    
                    <Text style={[styles.contactDescription, { color: theme.subText }]}>
                        Our support team is available 24/7 to assist you
                    </Text>

                    {/* Contact Options */}
                    <View style={styles.contactOptions}>
                        {/* Live Chat */}
                        <TouchableOpacity
                            style={[styles.contactCard, { 
                                backgroundColor: theme.card,
                                borderColor: theme.border || theme.card,
                            }]}
                            onPress={handleChat}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.contactIconCircle, { 
                                backgroundColor: theme.primary + "20" || theme.background 
                            }]}>
                                <Ionicons 
                                    name="chatbubble-ellipses" 
                                    size={24} 
                                    color={theme.primary || theme.text} 
                                />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactTitle, { color: theme.text }]}>
                                    Live Chat
                                </Text>
                                <Text style={[styles.contactSubtitle, { color: theme.subText }]}>
                                    Chat with our support team
                                </Text>
                            </View>
                            <Ionicons 
                                name="chevron-forward" 
                                size={20} 
                                color={theme.subText} 
                            />
                        </TouchableOpacity>

                        {/* Call Support */}
                        <TouchableOpacity
                            style={[styles.contactCard, { 
                                backgroundColor: theme.card,
                                borderColor: theme.border || theme.card,
                            }]}
                            onPress={handleCall}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.contactIconCircle, { 
                                backgroundColor: theme.primary + "20" || theme.background 
                            }]}>
                                <Ionicons 
                                    name="call" 
                                    size={24} 
                                    color={theme.primary || theme.text} 
                                />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactTitle, { color: theme.text }]}>
                                    Call Support
                                </Text>
                                <Text style={[styles.contactSubtitle, { color: theme.subText }]}>
                                    +1 (234) 567-890
                                </Text>
                            </View>
                            <Ionicons 
                                name="chevron-forward" 
                                size={20} 
                                color={theme.subText} 
                            />
                        </TouchableOpacity>

                        {/* Email Support */}
                        <TouchableOpacity
                            style={[styles.contactCard, { 
                                backgroundColor: theme.card,
                                borderColor: theme.border || theme.card,
                            }]}
                            onPress={handleEmail}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.contactIconCircle, { 
                                backgroundColor: theme.primary + "20" || theme.background 
                            }]}>
                                <Ionicons 
                                    name="mail" 
                                    size={24} 
                                    color={theme.primary || theme.text} 
                                />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactTitle, { color: theme.text }]}>
                                    Email Us
                                </Text>
                                <Text style={[styles.contactSubtitle, { color: theme.subText }]}>
                                    support@drydash.com
                                </Text>
                            </View>
                            <Ionicons 
                                name="chevron-forward" 
                                size={20} 
                                color={theme.subText} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={[styles.footer, { 
                    backgroundColor: theme.card,
                    borderColor: theme.primary || theme.border,
                }]}>
                    <Ionicons 
                        name="time" 
                        size={18} 
                        color={theme.primary || theme.text} 
                    />
                    <Text style={[styles.footerText, { color: theme.subText }]}>
                        Average response time: Under 5 minutes
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
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
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
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    headerSubtitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        textAlign: "center",
    },
    headerDescription: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
    faqSection: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginLeft: 8,
        letterSpacing: 0.3,
    },
    faqItem: {
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        overflow: "hidden",
    },
    faqQuestion: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    questionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 12,
    },
    questionNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    questionNumberText: {
        fontSize: 13,
        fontWeight: "700",
    },
    questionText: {
        fontSize: 15,
        fontWeight: "600",
        flex: 1,
        lineHeight: 20,
    },
    faqAnswer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    answerDivider: {
        height: 1,
        marginBottom: 12,
    },
    answerText: {
        fontSize: 14,
        lineHeight: 22,
        paddingLeft: 40,
    },
    contactSection: {
        marginBottom: 24,
    },
    contactDescription: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    contactOptions: {
        gap: 12,
    },
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    contactIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    contactSubtitle: {
        fontSize: 13,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        gap: 10,
    },
    footerText: {
        fontSize: 14,
        fontWeight: "500",
    },
});
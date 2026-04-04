import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/common/PageWrapper';

const LegalLayout = ({ title, lastUpdated, sections }) => {
    return (
        <PageWrapper className="bg-white min-h-screen flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-[900px] mx-auto">

                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">{title}</h1>
                        <p className="text-slate-400 text-sm font-medium">Last updated: {lastUpdated}</p>
                    </div>

                    {/* Content */}
                    <div className="space-y-10">
                        {sections.map((section, index) => (
                            <div key={index}>
                                <h2 className="text-xl font-bold text-slate-900 mb-3">{section.title}</h2>
                                {section.content.map((paragraph, pIndex) => (
                                    <p key={pIndex} className="text-slate-600 leading-relaxed text-lg mb-2">
                                        {paragraph}
                                    </p>
                                ))}
                                {section.list && (
                                    <ul className="list-disc pl-5 mt-2 space-y-2">
                                        {section.list.map((item, lIndex) => (
                                            <li key={lIndex} className="text-slate-600 leading-relaxed text-lg pl-2">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </main>

            <Footer />
        </PageWrapper>
    );
};

export const Privacy = () => {
    const sections = [
        {
            title: "1. Information We Collect",
            content: ["We collect only the information needed to provide our services.", "This may include:"],
            list: [
                "Your location (to show nearby shops)",
                "Basic account details if you sign up",
                "Messages sent between customers and shops"
            ]
        },
        {
            title: "2. How We Use Your Information",
            content: ["We use your information to:"],
            list: [
                "Show nearby shops and products",
                "Connect customers with local shops",
                "Improve the ShopLens experience"
            ]
        },
        {
            title: "",
            content: ["We do not sell your personal data."]
        },
        {
            title: "3. Location Data",
            content: ["Location is used only to:"],
            list: [
                "Detect nearby shops",
                "Improve search results"
            ]
        },
        {
            title: "",
            content: ["You can disable location access anytime."]
        },
        {
            title: "4. Data Sharing",
            content: ["We do not share your personal information with third parties, except:"],
            list: [
                "When required by law",
                "To operate essential services (hosting, notifications)"
            ]
        },
        {
            title: "5. Data Security",
            content: [
                "We use reasonable security measures to protect your data.",
                "No system is 100% secure, but we take protection seriously."
            ]
        },
        {
            title: "6. Your Choices",
            content: ["You can:"],
            list: [
                "Browse without creating an account",
                "Request account deletion",
                "Contact us for privacy questions"
            ]
        },
        {
            title: "7. Contact",
            content: ["For privacy concerns:", "shoplens017@gmail.com"]
        }
    ];

    return <LegalLayout title="Privacy Policy" lastUpdated="Jan 2026" sections={sections} />;
};

export const Terms = () => {
    const sections = [
        {
            title: "1. Using ShopLens",
            content: [
                "ShopLens helps users discover local shops and live inventory.",
                "By using ShopLens, you agree to these terms."
            ]
        },
        {
            title: "2. Eligibility",
            content: [
                "You must be at least 18 years old to create an account.",
                "Browsing without an account is allowed."
            ]
        },
        {
            title: "3. User Responsibilities",
            content: ["You agree to:"],
            list: [
                "Provide accurate information",
                "Use the platform lawfully",
                "Respect other users and shops"
            ]
        },
        {
            title: "4. Shop Owners",
            content: ["Shop owners are responsible for:"],
            list: [
                "Product accuracy",
                "Pricing",
                "Customer communication"
            ]
        },
        {
            title: "",
            content: ["ShopLens does not guarantee sales."]
        },
        {
            title: "5. Transactions",
            content: [
                "Purchases happen directly at the shop.",
                "ShopLens is not responsible for payments or disputes between users and shops."
            ]
        },
        {
            title: "6. Platform Availability",
            content: ["We strive to keep ShopLens available but do not guarantee uninterrupted service."]
        },
        {
            title: "7. Account Termination",
            content: [
                "We may suspend accounts that violate these terms.",
                "Users may request account deletion anytime."
            ]
        },
        {
            title: "8. Changes to These Terms",
            content: [
                "We may update these terms occasionally.",
                "Continued use means you accept updates."
            ]
        },
        {
            title: "9. Contact",
            content: ["Questions about these terms:", "shoplens017@gmail.com"]
        }
    ];

    return <LegalLayout title="Terms of Service" lastUpdated="Jan 2026" sections={sections} />;
};

export const Cookie = () => {
    const sections = [
        {
            title: "Cookie Policy",
            content: [
                "We use cookies to ensure you get the best experience on our website.",
                "Cookies are small text files stored on your device.",
                "We use essential cookies to keep you logged in and functional cookies to remember your preferences.",
                "You can control cookie settings in your browser."
            ]
        }
    ];
    return <LegalLayout title="Cookie Policy" lastUpdated="Jan 2026" sections={sections} />;
};

export default LegalLayout;

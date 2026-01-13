import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store,
  Utensils,
  Building2,
  Ticket,
  Package,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Church,
  Truck,
  Stethoscope,
  Factory,
  Hotel,
  Wrench,
  Users,
  Dumbbell,
  Briefcase,
  Quote,
  Zap,
  Shield,
  BarChart3,
  Clock,
  LucideIcon,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

interface Solution {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  longDescription: string;
  examples: string[];
  benefits: string[];
  features: { title: string; description: string; icon: LucideIcon }[];
  caseStudy: {
    company: string;
    industry: string;
    challenge: string;
    solution: string;
    results: string[];
    quote: string;
    author: string;
    role: string;
  };
  color: string;
}

const solutionsData: Record<string, Solution> = {
  "inventory-asset-tracking": {
    id: "inventory-asset-tracking",
    icon: Package,
    title: "Inventory & Asset Tracking",
    description: "Track equipment, products, and assets with smart QR codes.",
    longDescription: "Transform your asset management with intelligent QR code tracking. Whether you're managing church equipment, school resources, warehouse inventory, or event supplies, our solution provides real-time visibility and complete accountability for every item in your organization.",
    examples: ["Church equipment", "School books", "Shop stock", "Event check-in"],
    benefits: [
      "Real-time location tracking",
      "Automated inventory counts",
      "Loss prevention alerts",
      "Maintenance scheduling",
      "Complete audit trail",
      "Mobile-first scanning",
    ],
    features: [
      { title: "Smart QR Labels", description: "Generate durable QR labels that link directly to item details, status history, and maintenance records.", icon: Zap },
      { title: "Status Tracking", description: "Track items through multiple statuses: In Stock, In Use, Maintenance, Lost, and custom statuses.", icon: BarChart3 },
      { title: "Maintenance Alerts", description: "Set up automated reminders for scheduled maintenance and service intervals.", icon: Clock },
      { title: "Loss Prevention", description: "Get alerts when items haven't been scanned in a while, helping identify missing or forgotten assets.", icon: Shield },
    ],
    caseStudy: {
      company: "Grace Community Church",
      industry: "Religious Organization",
      challenge: "Managing over 500 pieces of audio-visual equipment, instruments, and furniture across multiple campuses was becoming impossible with spreadsheets. Equipment was frequently misplaced or double-booked.",
      solution: "Implemented IEOSUIA QR codes on all equipment with status tracking. Staff can now scan items to check them out, update locations, and log maintenance.",
      results: [
        "90% reduction in lost equipment",
        "40% faster equipment setup for events",
        "Complete visibility across 3 campuses",
        "R50,000+ saved in replacement costs",
      ],
      quote: "We finally know exactly where every piece of equipment is. The QR system has transformed how we manage our resources.",
      author: "Pastor David",
      role: "Operations Director",
    },
    color: "primary",
  },
  "retail-ecommerce": {
    id: "retail-ecommerce",
    icon: Store,
    title: "Retail & E-commerce",
    description: "Link to product pages, promotions, and loyalty programs.",
    longDescription: "Bridge the gap between physical and digital retail. Create seamless customer experiences by connecting in-store products to online content, promotions, and loyalty programs through simple QR scans.",
    examples: ["Product packaging", "In-store displays", "Receipt marketing"],
    benefits: [
      "Instant product information",
      "Customer engagement tracking",
      "Promotion analytics",
      "Loyalty program integration",
      "Reduced staff queries",
      "Enhanced shopping experience",
    ],
    features: [
      { title: "Product Information", description: "Link products to detailed specs, videos, reviews, and comparison tools.", icon: Zap },
      { title: "Promotion Tracking", description: "Track which promotions drive the most scans and conversions.", icon: BarChart3 },
      { title: "Customer Insights", description: "Understand when, where, and how customers engage with your products.", icon: Clock },
      { title: "Dynamic Content", description: "Update product information and promotions without reprinting QR codes.", icon: Shield },
    ],
    caseStudy: {
      company: "Urban Style Boutique",
      industry: "Fashion Retail",
      challenge: "Staff spent too much time answering product questions. Customers wanted more information than hang tags could provide, and promotional material was expensive to reprint.",
      solution: "Added QR codes to product tags linking to size guides, styling tips, and current promotions. Dynamic codes allow instant updates.",
      results: [
        "35% increase in customer engagement",
        "25% reduction in staff queries",
        "2x improvement in promotion response",
        "R8,000/month saved on printed materials",
      ],
      quote: "Our customers love scanning for styling tips. It's like having a personal shopper available 24/7.",
      author: "Nomvula",
      role: "Store Manager",
    },
    color: "accent",
  },
  "restaurants-cafes": {
    id: "restaurants-cafes",
    icon: Utensils,
    title: "Restaurants & Cafes",
    description: "Digital menus, contactless ordering, and customer feedback.",
    longDescription: "Modernize your dining experience with contactless menus, instant ordering, and streamlined feedback collection. Reduce costs, improve hygiene, and delight customers with digital-first service.",
    examples: ["Table menus", "Takeaway orders", "Review collection"],
    benefits: [
      "Contactless ordering",
      "Easy menu updates",
      "Customer feedback",
      "Reduced printing costs",
      "Allergen information",
      "Multi-language support",
    ],
    features: [
      { title: "Digital Menus", description: "Beautiful, mobile-optimized menus that update instantly. No more reprinting.", icon: Zap },
      { title: "Order Integration", description: "Link directly to your online ordering system for seamless takeaway orders.", icon: BarChart3 },
      { title: "Feedback Collection", description: "Gather customer reviews and feedback immediately after their meal.", icon: Clock },
      { title: "Menu Analytics", description: "See which menu items get the most views and engagement.", icon: Shield },
    ],
    caseStudy: {
      company: "Café Ubuntu",
      industry: "Restaurant",
      challenge: "Printing new menus every time prices changed was expensive. Staff struggled to explain allergen information, and collecting feedback was inconsistent.",
      solution: "Replaced all physical menus with QR codes linking to digital menus with allergen filters and feedback forms.",
      results: [
        "R15,000/year saved on menu printing",
        "95% customer satisfaction with digital menus",
        "3x more customer reviews collected",
        "Zero allergen-related complaints",
      ],
      quote: "Updating prices during load shedding seasons used to be a nightmare. Now it takes 2 minutes from my phone.",
      author: "Thabo",
      role: "Restaurant Owner",
    },
    color: "success",
  },
  "real-estate": {
    id: "real-estate",
    icon: Building2,
    title: "Real Estate",
    description: "Virtual tours, property details, and agent contact information.",
    longDescription: "Give potential buyers instant access to property information, virtual tours, and agent contact details. Generate leads around the clock and provide a modern, professional experience.",
    examples: ["Property signs", "Brochures", "Open house materials"],
    benefits: [
      "24/7 property access",
      "Lead generation",
      "Virtual tour links",
      "Instant agent contact",
      "Reduced brochure costs",
      "Track buyer interest",
    ],
    features: [
      { title: "Property Listings", description: "Comprehensive property details, photos, and virtual tours accessible with one scan.", icon: Zap },
      { title: "Lead Capture", description: "Collect potential buyer information for follow-up and nurturing.", icon: BarChart3 },
      { title: "Agent vCard", description: "Instant contact saving so buyers can easily reach the listing agent.", icon: Clock },
      { title: "Interest Analytics", description: "Track which properties get the most scans and buyer engagement.", icon: Shield },
    ],
    caseStudy: {
      company: "Premier Properties SA",
      industry: "Real Estate",
      challenge: "Traditional property signage provided limited information. Potential buyers had to call during office hours, losing many leads.",
      solution: "Added QR codes to all property signs linking to full listings, virtual tours, and agent contact details.",
      results: [
        "60% increase in lead capture",
        "Property inquiries 24/7, not just office hours",
        "50% reduction in brochure printing",
        "Average 40 scans per active listing",
      ],
      quote: "I've closed deals from leads who scanned our signs at 10pm. The QR codes never sleep.",
      author: "Michelle",
      role: "Senior Agent",
    },
    color: "warning",
  },
  "events-entertainment": {
    id: "events-entertainment",
    icon: Ticket,
    title: "Events & Entertainment",
    description: "Ticketing, event schedules, and exclusive content access.",
    longDescription: "Streamline your event operations with QR-powered check-ins, real-time schedule updates, and exclusive content delivery. Create memorable experiences while gathering valuable attendee insights.",
    examples: ["Event tickets", "Venue navigation", "VIP experiences"],
    benefits: [
      "Quick check-in",
      "Real-time updates",
      "Exclusive content",
      "Attendance tracking",
      "Venue navigation",
      "Sponsor visibility",
    ],
    features: [
      { title: "Fast Check-In", description: "Scan tickets for instant validation and entry. No more long queues.", icon: Zap },
      { title: "Live Updates", description: "Push schedule changes, announcements, and alerts to all attendees.", icon: BarChart3 },
      { title: "VIP Access", description: "Provide exclusive content and experiences to premium ticket holders.", icon: Clock },
      { title: "Attendance Analytics", description: "Track attendance patterns, popular sessions, and engagement metrics.", icon: Shield },
    ],
    caseStudy: {
      company: "Joburg Tech Conference",
      industry: "Events",
      challenge: "Check-in lines were 30+ minutes long. Attendees missed sessions due to poor navigation, and sponsors couldn't measure booth traffic.",
      solution: "Implemented QR tickets, venue navigation, and booth tracking QR codes throughout the venue.",
      results: [
        "Average check-in time reduced to 8 seconds",
        "85% of attendees used venue navigation",
        "Sponsors received detailed traffic reports",
        "30% increase in session attendance",
      ],
      quote: "The QR system transformed our event. Attendees loved the seamless experience, and sponsors finally got the data they needed.",
      author: "Sipho",
      role: "Event Director",
    },
    color: "primary",
  },
  "education": {
    id: "education",
    icon: GraduationCap,
    title: "Education",
    description: "Course materials, campus navigation, and student resources.",
    longDescription: "Enhance the learning experience with easy access to course materials, campus navigation, and student resources. Bridge physical and digital learning environments seamlessly.",
    examples: ["Library resources", "Campus maps", "Assignment submission"],
    benefits: [
      "Easy resource access",
      "Campus navigation",
      "Student engagement",
      "Paperless submissions",
      "Equipment tracking",
      "Attendance recording",
    ],
    features: [
      { title: "Resource Links", description: "Connect textbooks, equipment, and displays to supplementary digital content.", icon: Zap },
      { title: "Campus Navigation", description: "Help students and visitors find classrooms, offices, and facilities.", icon: BarChart3 },
      { title: "Equipment Checkout", description: "Track laboratory equipment, library books, and shared resources.", icon: Clock },
      { title: "Engagement Tracking", description: "Monitor which resources students access most frequently.", icon: Shield },
    ],
    caseStudy: {
      company: "Riverside High School",
      industry: "Education",
      challenge: "Library books were frequently lost. Lab equipment lacked proper tracking, and new students struggled to navigate the large campus.",
      solution: "Added QR codes to all books, equipment, and key campus locations with checkout tracking and navigation.",
      results: [
        "75% reduction in lost library books",
        "Complete lab equipment accountability",
        "New student orientation time cut in half",
        "R25,000/year saved on replacements",
      ],
      quote: "Our librarians can now focus on helping students learn instead of tracking down missing books.",
      author: "Mrs. Nkosi",
      role: "Principal",
    },
    color: "accent",
  },
  "churches-religious": {
    id: "churches-religious",
    icon: Church,
    title: "Churches & Religious Organizations",
    description: "Equipment tracking, event registration, and resource sharing.",
    longDescription: "Streamline church operations with comprehensive equipment tracking, easy event registration, and seamless resource distribution. Focus on ministry while technology handles the logistics.",
    examples: ["Sound equipment", "Sermon notes", "Donation links", "Event registration"],
    benefits: [
      "Equipment accountability",
      "Easy member engagement",
      "Simplified check-ins",
      "Resource distribution",
      "Volunteer coordination",
      "Donation convenience",
    ],
    features: [
      { title: "Equipment Management", description: "Track audio-visual gear, instruments, and furniture across services and events.", icon: Zap },
      { title: "Event Registration", description: "Simple sign-ups for camps, conferences, and special events.", icon: BarChart3 },
      { title: "Resource Sharing", description: "Share sermon notes, study guides, and announcements instantly.", icon: Clock },
      { title: "Giving Integration", description: "Link to donation pages for convenient, cashless giving.", icon: Shield },
    ],
    caseStudy: {
      company: "New Life Fellowship",
      industry: "Church",
      challenge: "With 3 services and multiple ministries, tracking who had what equipment was chaos. Volunteers spent hours searching for gear before events.",
      solution: "Implemented QR tracking for all equipment with check-out/check-in logging and ministry assignment.",
      results: [
        "Equipment setup time reduced by 60%",
        "Zero lost items in 12 months",
        "Volunteers save 5+ hours weekly",
        "Clear accountability across ministries",
      ],
      quote: "Sunday mornings are so much smoother now. Everyone knows exactly where everything is.",
      author: "Pastor James",
      role: "Senior Pastor",
    },
    color: "success",
  },
  "healthcare-medical": {
    id: "healthcare-medical",
    icon: Stethoscope,
    title: "Healthcare & Medical",
    description: "Patient information, appointments, and equipment tracking.",
    longDescription: "Improve patient experience and operational efficiency with QR-enabled intake forms, appointment scheduling, and medical equipment tracking. Ensure compliance while reducing administrative burden.",
    examples: ["Patient forms", "Equipment tracking", "Appointment links", "Medical records"],
    benefits: [
      "Paperless intake",
      "Equipment maintenance logs",
      "Quick patient access",
      "Compliance tracking",
      "Reduced wait times",
      "Hygiene improvements",
    ],
    features: [
      { title: "Digital Intake", description: "Patients complete forms on their devices before arriving, reducing wait times.", icon: Zap },
      { title: "Equipment Tracking", description: "Track medical equipment calibration, maintenance, and location.", icon: BarChart3 },
      { title: "Appointment Links", description: "Easy booking and rescheduling through QR codes on appointment cards.", icon: Clock },
      { title: "Compliance Records", description: "Maintain audit trails for equipment and procedures.", icon: Shield },
    ],
    caseStudy: {
      company: "Wellness Medical Centre",
      industry: "Healthcare",
      challenge: "Paper intake forms were time-consuming and error-prone. Medical equipment maintenance was tracked in outdated spreadsheets.",
      solution: "Deployed QR codes for digital intake and equipment tracking with maintenance scheduling.",
      results: [
        "Patient check-in time reduced by 70%",
        "100% compliance on equipment maintenance",
        "Eliminated paper form printing costs",
        "Improved patient satisfaction scores",
      ],
      quote: "Our patients love the modern experience, and our staff appreciate the efficiency.",
      author: "Dr. Patel",
      role: "Practice Manager",
    },
    color: "warning",
  },
  "logistics-warehousing": {
    id: "logistics-warehousing",
    icon: Truck,
    title: "Logistics & Warehousing",
    description: "Shipment tracking, warehouse management, and supply chain.",
    longDescription: "Optimize your supply chain with QR-powered shipment tracking, warehouse bin management, and delivery confirmation. Gain complete visibility from receipt to dispatch.",
    examples: ["Pallet tracking", "Shipment labels", "Warehouse bins", "Delivery confirmation"],
    benefits: [
      "Real-time tracking",
      "Reduced errors",
      "Faster picking",
      "Complete audit trails",
      "Inventory accuracy",
      "Delivery proof",
    ],
    features: [
      { title: "Shipment Tracking", description: "Track packages through every stage from warehouse to delivery.", icon: Zap },
      { title: "Bin Management", description: "Label warehouse locations for accurate picking and put-away.", icon: BarChart3 },
      { title: "Delivery Confirmation", description: "Scan for proof of delivery with timestamp and location.", icon: Clock },
      { title: "Audit Trail", description: "Complete history of every item movement for accountability.", icon: Shield },
    ],
    caseStudy: {
      company: "Swift Logistics",
      industry: "Logistics",
      challenge: "Manual tracking led to frequent picking errors and lost shipments. Delivery disputes were common without proof of delivery.",
      solution: "Implemented QR codes on all pallets, bins, and shipments with scan-based tracking.",
      results: [
        "Picking errors reduced by 85%",
        "Lost shipment claims eliminated",
        "Warehouse efficiency up 40%",
        "Customer disputes resolved instantly",
      ],
      quote: "Every package is now tracked from dock to door. Our customers have complete visibility.",
      author: "Johan",
      role: "Warehouse Manager",
    },
    color: "primary",
  },
  "manufacturing": {
    id: "manufacturing",
    icon: Factory,
    title: "Manufacturing",
    description: "Production tracking, quality control, and equipment maintenance.",
    longDescription: "Enhance manufacturing operations with QR-enabled production tracking, quality control checkpoints, and equipment maintenance management. Ensure traceability and compliance at every step.",
    examples: ["Work orders", "Quality checks", "Machine maintenance", "Parts tracking"],
    benefits: [
      "Production monitoring",
      "Quality assurance",
      "Maintenance alerts",
      "Traceability",
      "Defect tracking",
      "Compliance documentation",
    ],
    features: [
      { title: "Work Order Tracking", description: "Track production jobs through each workstation and process.", icon: Zap },
      { title: "Quality Checkpoints", description: "Log quality checks and inspections at designated stages.", icon: BarChart3 },
      { title: "Machine Maintenance", description: "Schedule and track equipment maintenance with service history.", icon: Clock },
      { title: "Parts Traceability", description: "Track components from receipt through final assembly.", icon: Shield },
    ],
    caseStudy: {
      company: "Precision Parts Manufacturing",
      industry: "Manufacturing",
      challenge: "Quality issues were discovered too late in production. Machine breakdowns disrupted schedules due to missed maintenance.",
      solution: "Added QR codes to workstations for quality logging and machines for maintenance tracking.",
      results: [
        "Defect rate reduced by 60%",
        "Unplanned downtime cut by 45%",
        "Full product traceability achieved",
        "Passed ISO audit with zero findings",
      ],
      quote: "We can now trace any product back to exact machine, operator, and timestamp.",
      author: "Engineering Manager",
      role: "Quality Director",
    },
    color: "accent",
  },
  "hospitality-tourism": {
    id: "hospitality-tourism",
    icon: Hotel,
    title: "Hospitality & Tourism",
    description: "Guest services, Wi-Fi access, and local guides.",
    longDescription: "Elevate guest experiences with contactless services, instant Wi-Fi access, and curated local guides. Reduce front desk queries while delighting guests with modern convenience.",
    examples: ["Room info", "Wi-Fi access", "Local attractions", "Feedback forms"],
    benefits: [
      "Contactless services",
      "Guest engagement",
      "Easy updates",
      "Review collection",
      "Reduced queries",
      "Local partnerships",
    ],
    features: [
      { title: "Room Information", description: "In-room QR codes for amenities, services, and hotel information.", icon: Zap },
      { title: "Wi-Fi Access", description: "Guests connect to Wi-Fi with a simple scan—no password typing.", icon: BarChart3 },
      { title: "Local Guides", description: "Curated recommendations for restaurants, attractions, and activities.", icon: Clock },
      { title: "Feedback Collection", description: "Gather real-time guest feedback during their stay.", icon: Shield },
    ],
    caseStudy: {
      company: "Sunset Beach Lodge",
      industry: "Hospitality",
      challenge: "Guests constantly asked for Wi-Fi passwords and local recommendations. Printed materials were outdated and expensive.",
      solution: "Placed QR codes in rooms linking to digital guides, Wi-Fi, and feedback forms.",
      results: [
        "Front desk queries reduced by 50%",
        "Guest satisfaction increased 25%",
        "Local partner referrals up 3x",
        "Real-time feedback enables quick fixes",
      ],
      quote: "Guests love the modern touch. They scan once and have everything they need.",
      author: "Linda",
      role: "General Manager",
    },
    color: "success",
  },
  "maintenance-repairs": {
    id: "maintenance-repairs",
    icon: Wrench,
    title: "Maintenance & Repairs",
    description: "Service history, work orders, and equipment manuals.",
    longDescription: "Streamline maintenance operations with complete service history, digital work orders, and instant access to equipment manuals. Ensure nothing falls through the cracks.",
    examples: ["Service logs", "Work orders", "Equipment manuals", "Spare parts"],
    benefits: [
      "Complete history",
      "Preventive alerts",
      "Quick access to manuals",
      "Parts ordering",
      "Technician efficiency",
      "Compliance records",
    ],
    features: [
      { title: "Service History", description: "Complete maintenance log for every piece of equipment.", icon: Zap },
      { title: "Work Orders", description: "Create and track maintenance requests with status updates.", icon: BarChart3 },
      { title: "Manual Access", description: "Instant access to equipment manuals and troubleshooting guides.", icon: Clock },
      { title: "Parts Inventory", description: "Track spare parts usage and reorder points.", icon: Shield },
    ],
    caseStudy: {
      company: "BuildRight Facilities",
      industry: "Facility Management",
      challenge: "Maintenance technicians wasted time searching for equipment manuals and service history. Work orders got lost in the shuffle.",
      solution: "Added QR codes to all equipment linking to service history, manuals, and work order creation.",
      results: [
        "Technician efficiency up 35%",
        "Work order completion improved 50%",
        "Equipment lifespan extended 20%",
        "Complete digital maintenance records",
      ],
      quote: "Our technicians scan the equipment and have everything they need. No more binders and paperwork.",
      author: "Chris",
      role: "Facilities Director",
    },
    color: "warning",
  },
  "non-profits-ngos": {
    id: "non-profits-ngos",
    icon: Users,
    title: "Non-Profits & NGOs",
    description: "Donations, volunteer coordination, and resource distribution.",
    longDescription: "Maximize impact with easy donation collection, volunteer coordination, and transparent resource distribution. Show donors exactly where their contributions go.",
    examples: ["Donation QR", "Volunteer signup", "Event materials", "Impact reports"],
    benefits: [
      "Easy donations",
      "Volunteer management",
      "Resource tracking",
      "Transparency",
      "Event coordination",
      "Impact reporting",
    ],
    features: [
      { title: "Donation Links", description: "Scan-to-donate QR codes for events, mailings, and campaigns.", icon: Zap },
      { title: "Volunteer Coordination", description: "Easy sign-up and check-in for volunteer activities.", icon: BarChart3 },
      { title: "Resource Tracking", description: "Track distribution of aid, supplies, and equipment.", icon: Clock },
      { title: "Impact Visibility", description: "Share impact reports and updates with donors.", icon: Shield },
    ],
    caseStudy: {
      company: "Hope Foundation SA",
      industry: "Non-Profit",
      challenge: "Cash donations at events were declining. Tracking distributed resources was manual and error-prone.",
      solution: "Implemented QR donation stations and resource distribution tracking with beneficiary logging.",
      results: [
        "Event donations increased 80%",
        "100% resource accountability",
        "Donor reporting automated",
        "Volunteer check-in streamlined",
      ],
      quote: "Donors can now see exactly where their money goes. Transparency has increased giving significantly.",
      author: "Thembi",
      role: "Executive Director",
    },
    color: "primary",
  },
  "fitness-gyms": {
    id: "fitness-gyms",
    icon: Dumbbell,
    title: "Fitness & Gyms",
    description: "Equipment guides, class schedules, and membership management.",
    longDescription: "Enhance the fitness experience with equipment instruction videos, class schedules, and seamless membership interactions. Keep members engaged and informed.",
    examples: ["Equipment guides", "Class schedules", "Membership cards", "Trainer contacts"],
    benefits: [
      "Self-service info",
      "Easy scheduling",
      "Member engagement",
      "Equipment tracking",
      "Reduced staff queries",
      "Safety compliance",
    ],
    features: [
      { title: "Equipment Instructions", description: "Video guides and proper form instructions on each machine.", icon: Zap },
      { title: "Class Booking", description: "Scan to view schedules and book classes instantly.", icon: BarChart3 },
      { title: "Equipment Maintenance", description: "Track equipment condition and maintenance needs.", icon: Clock },
      { title: "Trainer Connect", description: "Easy booking and contact for personal training sessions.", icon: Shield },
    ],
    caseStudy: {
      company: "FitZone Gym",
      industry: "Fitness",
      challenge: "New members didn't know how to use equipment properly. Staff spent too much time on basic questions instead of training.",
      solution: "Added QR codes to all equipment linking to instructional videos and proper form guides.",
      results: [
        "New member confidence increased 70%",
        "Staff freed up for actual training",
        "Equipment injuries reduced 40%",
        "Class bookings up 50%",
      ],
      quote: "Members love scanning for quick tutorials. It's like having a trainer at every machine.",
      author: "Coach Mike",
      role: "Gym Manager",
    },
    color: "accent",
  },
  "professional-services": {
    id: "professional-services",
    icon: Briefcase,
    title: "Professional Services",
    description: "Digital business cards, portfolios, and client engagement.",
    longDescription: "Elevate your professional presence with digital business cards, portfolio links, and seamless client engagement. Make lasting impressions with modern convenience.",
    examples: ["vCard sharing", "Portfolio links", "Meeting scheduling", "Document access"],
    benefits: [
      "Professional image",
      "Easy contact sharing",
      "Lead capture",
      "Document distribution",
      "Meeting scheduling",
      "Network building",
    ],
    features: [
      { title: "Digital vCards", description: "Share contact details instantly—no more lost business cards.", icon: Zap },
      { title: "Portfolio Links", description: "Showcase your work and credentials with a simple scan.", icon: BarChart3 },
      { title: "Meeting Booking", description: "Clients can schedule appointments directly from your card.", icon: Clock },
      { title: "Document Sharing", description: "Share proposals, presentations, and resources securely.", icon: Shield },
    ],
    caseStudy: {
      company: "Insight Consulting",
      industry: "Consulting",
      challenge: "Traditional business cards were often lost. Following up with potential clients was slow and inconsistent.",
      solution: "Replaced paper cards with QR-enabled digital cards linking to portfolios and booking pages.",
      results: [
        "Lead capture rate doubled",
        "Follow-up time reduced to instant",
        "Professional image enhanced",
        "Networking efficiency improved 60%",
      ],
      quote: "I hand out one card that never runs out. Prospects scan, connect, and can book a meeting on the spot.",
      author: "Sarah",
      role: "Managing Partner",
    },
    color: "success",
  },
};

const colorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
};

export default function SolutionDetail() {
  const { solutionId } = useParams<{ solutionId: string }>();
  const solution = solutionId ? solutionsData[solutionId] : null;

  if (!solution) {
    return <Navigate to="/solutions" replace />;
  }

  const Icon = solution.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container mx-auto px-4 relative z-10">
            <Link
              to="/solutions"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Solutions
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl"
            >
              <div
                className={`w-20 h-20 rounded-3xl ${
                  colorClasses[solution.color as keyof typeof colorClasses]
                } border flex items-center justify-center mb-6`}
              >
                <Icon className="w-10 h-10" />
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                {solution.title}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mb-8">
                {solution.longDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits & Examples */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-2xl font-bold mb-6">Key Benefits</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {solution.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Use Cases */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-display text-2xl font-bold mb-6">Common Use Cases</h2>
                <div className="flex flex-wrap gap-3">
                  {solution.examples.map((example) => (
                    <span
                      key={example}
                      className="px-4 py-2 rounded-full bg-card border border-border text-sm"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Industry-Specific Features
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tailored capabilities designed for {solution.title.toLowerCase()} needs.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {solution.features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
                  Case Study
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                  {solution.caseStudy.company}
                </h2>
                <p className="text-muted-foreground">{solution.caseStudy.industry}</p>
              </div>

              <div className="space-y-8">
                <div className="p-8 rounded-3xl bg-card border border-border">
                  <h3 className="font-semibold text-lg mb-3 text-destructive">The Challenge</h3>
                  <p className="text-muted-foreground">{solution.caseStudy.challenge}</p>
                </div>

                <div className="p-8 rounded-3xl bg-card border border-border">
                  <h3 className="font-semibold text-lg mb-3 text-primary">The Solution</h3>
                  <p className="text-muted-foreground">{solution.caseStudy.solution}</p>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                  <h3 className="font-semibold text-lg mb-4 text-success">The Results</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {solution.caseStudy.results.map((result) => (
                      <div key={result} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span>{result}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <div className="p-8 rounded-3xl bg-card border border-border text-center">
                  <Quote className="w-10 h-10 text-primary/30 mx-auto mb-4" />
                  <blockquote className="text-xl font-medium mb-4 italic">
                    "{solution.caseStudy.quote}"
                  </blockquote>
                  <div>
                    <p className="font-semibold">{solution.caseStudy.author}</p>
                    <p className="text-sm text-muted-foreground">{solution.caseStudy.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join organizations using IEOSUIA QR for {solution.title.toLowerCase()}.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
                    Start Free Today
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/#pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

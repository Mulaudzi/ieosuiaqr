import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Rocket, Heart, Users, MapPin, Mail, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const values = [
  {
    icon: Rocket,
    title: "Innovation First",
    description: "We're always exploring new technologies and approaches to deliver the best solutions for our clients."
  },
  {
    icon: Heart,
    title: "Passion for Quality",
    description: "We take pride in our work and strive for excellence in everything we create."
  },
  {
    icon: Users,
    title: "Collaborative Spirit",
    description: "We believe in the power of teamwork and open communication to achieve great things."
  },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Join Our Team
              </h1>
              <p className="text-lg text-muted-foreground">
                We're building the future of QR code technology and digital solutions at IEOSUIA.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">We're Hiring Soon!</CardTitle>
                  <CardDescription className="text-base">
                    We're growing and will be opening new positions in the near future.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <p className="text-muted-foreground">
                    IEOSUIA is expanding its team to deliver even more innovative digital solutions. 
                    We're looking for talented individuals who are passionate about technology, 
                    creativity, and making a difference.
                  </p>
                  
                  <div className="p-4 rounded-xl bg-background/50 border border-border">
                    <h3 className="font-semibold mb-2">Interested in joining us?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send your CV and a brief introduction to:
                    </p>
                    <a 
                      href="mailto:hello@ieosuia.com?subject=Career Inquiry - IEOSUIA QR"
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      <Mail className="h-4 w-4" />
                      hello@ieosuia.com
                    </a>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Based in Johannesburg, South Africa • Remote-friendly</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                At IEOSUIA, we believe in creating an environment where creativity thrives and every team member can grow.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full text-center">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About IEOSUIA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl font-bold text-foreground mb-6">About IEOSUIA</h2>
              <p className="text-muted-foreground mb-6">
                IEOSUIA is a digital solutions company based in Johannesburg, South Africa. 
                We provide comprehensive services including web development, app creation, 
                QR code solutions, and professional digital branding. Our mission is to help 
                businesses tell their story beautifully through technology.
              </p>
              <p className="text-muted-foreground mb-8">
                With a focus on quality and innovation, we've helped businesses across various 
                industries establish their digital presence and streamline their operations.
              </p>
              <Button variant="outline" size="lg" asChild>
                <a href="https://www.ieosuia.com" target="_blank" rel="noopener noreferrer">
                  Learn More About IEOSUIA
                </a>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;

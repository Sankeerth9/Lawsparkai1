import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      details: 'contact@lawspark.ai',
      description: 'Send us an email and we\'ll respond within 24 hours'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: '+1 (555) 123-4567',
      description: 'Monday to Friday, 9 AM to 6 PM PST'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: 'San Francisco, CA',
      description: '123 Legal Tech Street, Suite 100'
    }
  ];

  const subjects = [
    'General Inquiry',
    'Technical Support',
    'Partnership Opportunities',
    'Media & Press',
    'Legal Questions',
    'Feature Request',
    'Other'
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center py-20">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="inline-flex p-4 bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-text-primary">Message Sent!</h2>
            <p className="text-text-secondary">
              Thank you for contacting us. We'll get back to you within 24 hours.
            </p>
          </div>
          <button
            onClick={() => setIsSubmitted(false)}
            className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-dark to-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
                Get In Touch
              </h1>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
                Have questions about our legal technology platform? We're here to help. 
                Reach out to our team for support, partnerships, or general inquiries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="bg-primary-light rounded-2xl p-8 shadow-glow border border-accent-blue/20 text-center space-y-4 hover:shadow-glow-lg transition-shadow">
                  <div className="inline-flex p-4 bg-gradient-to-r from-accent-blue to-accent-cyan rounded-xl">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-text-primary">{info.title}</h3>
                    <p className="text-lg font-semibold text-accent-cyan">{info.details}</p>
                    <p className="text-text-secondary">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-text-primary">Send Us a Message</h2>
                <p className="text-lg text-text-secondary leading-relaxed">
                  Fill out the form below and our team will get back to you as soon as possible. 
                  We typically respond within 24 hours during business days.
                </p>
              </div>

              <div className="bg-primary-dark rounded-xl p-6 space-y-4 border border-accent-blue/20">
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-accent-cyan" />
                  <h3 className="font-semibold text-text-primary">Response Time</h3>
                </div>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p>• General inquiries: Within 24 hours</p>
                  <p>• Technical support: Within 4 hours</p>
                  <p>• Partnership requests: Within 48 hours</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-light rounded-2xl p-8 shadow-glow border border-accent-blue/20">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-primary border border-accent-blue/30 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-colors text-text-primary"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-primary border border-accent-blue/30 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-colors text-text-primary"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-text-secondary mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-primary border border-accent-blue/30 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-colors text-text-primary"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject, index) => (
                      <option key={index} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-primary border border-accent-blue/30 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent transition-colors text-text-primary resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold rounded-lg hover:from-accent-cyan hover:to-accent-teal disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-primary-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Quick answers to common questions about our platform and services
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-primary rounded-xl p-6 border border-accent-blue/20">
                <h3 className="font-semibold text-text-primary mb-2">Is my data secure?</h3>
                <p className="text-text-secondary text-sm">
                  Yes, we use enterprise-grade encryption and never store your documents permanently. 
                  All data is processed securely and deleted after analysis.
                </p>
              </div>
              <div className="bg-primary rounded-xl p-6 border border-accent-blue/20">
                <h3 className="font-semibold text-text-primary mb-2">Do you provide legal advice?</h3>
                <p className="text-text-secondary text-sm">
                  Our platform provides legal information and analysis, but not legal advice. 
                  Always consult with a qualified attorney for specific legal matters.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-primary rounded-xl p-6 border border-accent-blue/20">
                <h3 className="font-semibold text-text-primary mb-2">What file formats do you support?</h3>
                <p className="text-text-secondary text-sm">
                  We support PDF, DOC, DOCX, and TXT files up to 10MB in size for contract validation.
                </p>
              </div>
              <div className="bg-primary rounded-xl p-6 border border-accent-blue/20">
                <h3 className="font-semibold text-text-primary mb-2">Is there a free trial?</h3>
                <p className="text-text-secondary text-sm">
                  Yes, you can try our basic features for free. Contact us to learn about our premium plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
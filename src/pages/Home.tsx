import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, FileCheck, Shield, Zap, Users, Award, ArrowRight, CheckCircle, Star, Quote } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Home: React.FC = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: MessageCircle,
      title: t('features.chatbot.title'),
      description: t('features.chatbot.description'),
      href: '/chatbot',
      color: 'from-accent-blue to-accent-cyan',
      benefits: ['24/7 availability', 'Instant responses', 'Legal terminology explained', 'Case law references']
    },
    {
      icon: FileCheck,
      title: t('features.contract.title'),
      description: t('features.contract.description'),
      href: '/validator',
      color: 'from-accent-cyan to-accent-teal',
      benefits: ['Risk assessment', 'Clause analysis', 'Compliance checking', 'Improvement suggestions']
    }
  ];

  const benefits = [
    { icon: Shield, title: 'Secure & Confidential', description: 'Enterprise-grade security with end-to-end encryption for all your legal documents' },
    { icon: Zap, title: 'Instant Results', description: 'Get comprehensive legal insights and analysis in seconds, not hours or days' },
    { icon: Users, title: 'Expert Trained', description: 'AI trained by legal professionals using real case studies and legal precedents' },
    { icon: Award, title: 'Trusted Platform', description: 'Used by law firms, legal departments, and individuals worldwide' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Small Business Owner',
      company: 'Johnson Consulting',
      content: 'LawSpark AI helped me understand my vendor contracts and identify potential risks I never would have caught. The AI explanations are clear and actionable.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Legal Counsel',
      company: 'TechStart Inc.',
      content: 'As in-house counsel, this platform saves me hours of initial contract review. The validation tool catches issues early and the chatbot helps explain complex terms to our team.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Freelance Designer',
      company: 'Independent',
      content: 'Before signing any client contract, I run it through the validator. It\'s like having a lawyer review my agreements without the expensive hourly fees.',
      rating: 5
    }
  ];

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative bg-primary-dark overflow-hidden min-h-screen flex items-center hero-glow">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234facfe' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-primary-light rounded-full text-accent-cyan font-medium text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  {t('home.trusted')}
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-text-primary leading-tight">
                  {t('home.hero.title')}
                  <span className="block gradient-text">{t('home.hero.subtitle')}</span>
                </h1>
                
                <p className="text-xl text-text-secondary leading-relaxed max-w-2xl">
                  {t('home.hero.description')}
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/chatbot"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold rounded-xl hover:from-accent-cyan hover:to-accent-teal transition-all transform hover:scale-105 shadow-glow"
                >
                  <MessageCircle className="h-5 w-5 mr-3" />
                  {t('home.hero.cta.chatbot')}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link
                  to="/validator"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-transparent text-accent-cyan border-2 border-accent-cyan/30 font-semibold rounded-xl hover:bg-primary-light transition-all transform hover:scale-105 gradient-border"
                >
                  <FileCheck className="h-5 w-5 mr-3" />
                  <span>{t('home.hero.cta.chatbot')}</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-accent-cyan fill-current" />
                  ))}
                  <span className="ml-2 text-text-secondary font-medium">4.9/5 from 2,000+ reviews</span>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Visual */}
            <div className="relative">
              <div className="relative bg-primary-light rounded-2xl shadow-glow-lg p-8 border border-accent-blue/20">
                {/* Legal Image */}
                <img 
                  src="https://images.pexels.com/photos/5668481/pexels-photo-5668481.jpeg" 
                  alt="Legal scales of justice" 
                  className="w-full h-auto rounded-lg mb-6 shadow-lg"
                />
                
                {/* Mock Chat Interface */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 pb-4 border-b border-accent-blue/20">
                    <div className="w-10 h-10 bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">AI Legal Assistant</h3>
                      <p className="text-sm text-accent-teal">● Online</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-primary rounded-lg p-3 max-w-xs">
                      <p className="text-sm text-text-secondary">What should I look for in an employment contract?</p>
                    </div>
                    <div className="bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg p-3 max-w-sm ml-auto">
                      <p className="text-sm">Key elements to review include: compensation structure, termination clauses, non-compete agreements, and intellectual property rights...</p>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-accent-teal text-white p-3 rounded-xl shadow-glow">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-accent-blue text-white p-3 rounded-xl shadow-glow">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-primary py-12 border-y border-accent-blue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-text-muted font-medium">Trusted and Secure</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'SOC 2 Compliant', description: 'Security & Privacy Certified' },
              { name: '256-bit SSL', description: 'Bank-level Encryption' },
              { name: 'GDPR Compliant', description: 'Data Protection Certified' },
              { name: '99.9% Uptime', description: 'Reliable Service Guarantee' }
            ].map((badge, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="font-semibold text-text-primary">{badge.name}</div>
                <div className="text-sm text-text-muted">{badge.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">{t('features.title')}</h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              {t('features.description')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-primary rounded-2xl p-8 shadow-glow border border-accent-blue/20 hover:shadow-glow-lg transition-all">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-r ${feature.color} shadow-glow`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-text-primary">{feature.title}</h3>
                    </div>
                    
                    <p className="text-text-secondary leading-relaxed text-lg">
                      {feature.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {feature.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-accent-teal flex-shrink-0" />
                          <span className="text-sm text-text-secondary">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to={feature.href}
                      className="group inline-flex items-center text-accent-cyan font-semibold hover:text-accent-teal transition-colors"
                    >
                      <span>Try it now</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legal Image Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg" 
                alt="Judge gavel and scales of justice" 
                className="rounded-xl shadow-glow-lg border border-accent-blue/20 w-full h-auto"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-text-primary">Advanced Legal Analysis</h2>
              <p className="text-xl text-text-secondary leading-relaxed">
                Our AI-powered platform analyzes legal documents with precision and accuracy, 
                identifying potential issues and providing actionable recommendations.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent-teal mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Contract Risk Assessment</h3>
                    <p className="text-text-secondary">Identify potential risks and liabilities in your contracts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent-teal mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Legal Research Assistant</h3>
                    <p className="text-text-secondary">Find relevant case law and precedents in seconds</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent-teal mt-1" />
                  <div>
                    <h3 className="font-semibold text-text-primary">Document Summarization</h3>
                    <p className="text-text-secondary">Get concise summaries of complex legal documents</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Trusted by Professionals Worldwide
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              See what our users say about their experience with LawSpark AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-primary-dark rounded-2xl p-8 relative border border-accent-blue/20 shadow-glow">
                <div className="absolute -top-4 left-8">
                  <div className="bg-gradient-to-r from-accent-blue to-accent-cyan p-2 rounded-lg">
                    <Quote className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <div className="pt-4 space-y-4">
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-accent-cyan fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-text-secondary leading-relaxed">"{testimonial.content}"</p>
                  
                  <div className="pt-4 border-t border-accent-blue/20">
                    <div className="font-semibold text-text-primary">{testimonial.name}</div>
                    <div className="text-sm text-text-muted">{testimonial.role}</div>
                    <div className="text-sm text-accent-cyan">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Why Choose LawSpark AI?
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Built for professionals who need reliable, accurate, and efficient legal technology solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center space-y-4 group">
                  <div className="inline-flex p-4 bg-primary rounded-xl group-hover:bg-primary-light transition-colors border border-accent-blue/20">
                    <Icon className="h-8 w-8 text-accent-cyan" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">{benefit.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary to-primary-light py-20 border-t border-accent-blue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
                Ready to Transform Your Legal Workflow?
              </h2>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                Join thousands of professionals who trust LawSpark AI for their legal technology needs.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/chatbot"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold rounded-xl hover:from-accent-cyan hover:to-accent-teal transition-all transform hover:scale-105 shadow-glow"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                {t('home.hero.cta.chatbot')}
              </Link>
              <Link
                to="/validator"
                className="inline-flex items-center px-8 py-4 bg-primary-light text-text-primary font-semibold rounded-xl hover:bg-primary transition-all transform hover:scale-105 border border-accent-blue/30"
              >
                <FileCheck className="h-5 w-5 mr-2" />
                {t('home.hero.cta.contract')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
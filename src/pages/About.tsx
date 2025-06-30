import React from 'react';
import { Shield, Users, Award, Target, CheckCircle, Lightbulb, Globe, Heart, Zap, FileText, MessageCircle, VolumeX, Search, Lock } from 'lucide-react';

const About: React.FC = () => {
  const values = [
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'We prioritize the security and confidentiality of your legal information with enterprise-grade protection for all Indian citizens.'
    },
    {
      icon: Users,
      title: 'Accessibility',
      description: 'Making legal knowledge accessible to everyone in India, regardless of their legal background, language, or experience.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering the highest quality legal technology solutions with continuous innovation for Indian legal needs.'
    },
    {
      icon: Target,
      title: 'Precision',
      description: 'Our AI models are trained on extensive Indian legal databases to provide accurate and reliable insights specific to Indian law.'
    }
  ];

  const features = [
    'AI-powered legal assistance available 24/7 for Indian legal questions',
    'Comprehensive contract analysis with Indian legal compliance checks',
    'User-friendly interface designed for non-lawyers across India',
    'Secure document processing with privacy protection for sensitive Indian legal documents',
    'Multilingual support for major Indian languages',
    'Voice support for accessibility across diverse Indian communities'
  ];

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-dark to-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
                About Lawspark AI
              </h1>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
                India's first AI legal assistant platform designed to make law simple, accessible, and 
                understandable for everyone — not just lawyers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Image Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.pexels.com/photos/5668481/pexels-photo-5668481.jpeg" 
                alt="Legal gavel" 
                className="rounded-xl shadow-glow-lg border border-accent-blue/20 w-full h-auto"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-text-primary">Our Vision</h2>
              <p className="text-lg text-text-secondary leading-relaxed mb-4">
                At Lawspark AI, we believe that legal literacy is power — and it should be available to every citizen, in every language.
              </p>
              <p className="text-lg text-text-secondary leading-relaxed">
                We use cutting-edge AI technologies including RAG, NLP, voice technology, and translation to help users review legal documents safely, understand their rights and duties, and ask legal questions in plain language.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-text-primary">Our Mission</h2>
                <p className="text-lg text-text-secondary leading-relaxed mb-4">
                  To democratize access to justice by breaking down complex legal jargon and offering AI-based legal tools for every Indian — especially underserved, non-English-speaking, or first-time legal users.
                </p>
                <p className="text-lg text-text-secondary leading-relaxed mb-4">
                  We're building a future where legal knowledge is no longer locked behind expensive consultations and complex jargon, but available to all Indians who need it, when they need it most.
                </p>
              </div>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-accent-teal flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-accent-blue to-accent-cyan rounded-2xl p-8 text-white shadow-glow">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex p-3 bg-white/20 rounded-xl mb-4">
                      <Lightbulb className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Built During Innovation</h3>
                    <p className="text-blue-100">
                      Lawspark AI was created during the Bolt Hackathon 2025, using cutting-edge tools
                    </p>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-100">Built with:</p>
                    <p className="text-white font-medium mt-1">OpenAI · ElevenLabs · Lingo.dev · PicaOS · Supabase</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-blue-100 text-sm">
                      This platform is growing fast — with features designed by students, developers, and legal researchers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Our Core Values</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              The principles that guide everything we do and every decision we make
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="text-center space-y-4 group">
                  <div className="inline-flex p-4 bg-primary rounded-xl group-hover:bg-primary-dark transition-colors border border-accent-blue/20">
                    <Icon className="h-8 w-8 text-accent-cyan" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">{value.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legal Image Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <h2 className="text-3xl font-bold text-text-primary">Advanced Legal Technology</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                Our platform is built on state-of-the-art AI models specifically trained on vast legal datasets, 
                including Indian case law, statutes, regulations, and legal commentary from multiple jurisdictions.
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent-teal mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-text-primary">Natural Language Processing</h4>
                    <p className="text-text-secondary text-sm">Advanced algorithms that understand Indian legal terminology and context</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent-teal mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-text-primary">Document Analysis</h4>
                    <p className="text-text-secondary text-sm">Sophisticated pattern recognition for contract review</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-accent-teal mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-text-primary">Continuous Learning</h4>
                    <p className="text-text-secondary text-sm">Models that improve with every interaction with Indian legal documents</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img 
                src="https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg" 
                alt="Legal scales of justice" 
                className="rounded-xl shadow-glow-lg border border-accent-blue/20 w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">🌟 Why Choose Us</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              ✅ Why Lawspark AI is Different
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-primary-light rounded-2xl p-8 shadow-glow border border-accent-blue/20 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-xl">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">🧠 Smart Legal Help</h3>
              </div>
              <p className="text-text-secondary leading-relaxed">
                AI-powered answers to legal questions — accurate, human-friendly, and fast. Designed specifically for Indian legal contexts.
              </p>
            </div>

            <div className="bg-primary-light rounded-2xl p-8 shadow-glow border border-accent-blue/20 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">📄 Contract Validator</h3>
              </div>
              <p className="text-text-secondary leading-relaxed">
                Get instant risk analysis, clause explanations, and improvement tips for contracts under Indian law.
              </p>
            </div>

            <div className="bg-primary-light rounded-2xl p-8 shadow-glow border border-accent-blue/20 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-xl">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">🌐 Multilingual Support</h3>
              </div>
              <p className="text-text-secondary leading-relaxed">
                Use the platform in your preferred language — including Hindi, Telugu, and other Indian languages.
              </p>
            </div>

            <div className="bg-primary-light rounded-2xl p-8 shadow-glow border border-accent-blue/20 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-xl">
                  <VolumeX className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">🔊 Voice Support</h3>
              </div>
              <p className="text-text-secondary leading-relaxed">
                Hear legal summaries spoken clearly via ElevenLabs integration, making legal content accessible to all.
              </p>
            </div>

            <div className="bg-primary-light rounded-2xl p-8 shadow-glow border border-accent-blue/20 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-xl">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">🔍 Upload & Analyze</h3>
              </div>
              <p className="text-text-secondary leading-relaxed">
                Use AI to search and answer from your own legal documents with our RAG-powered document analysis.
              </p>
            </div>

            <div className="bg-primary-light rounded-2xl p-8 shadow-glow border border-accent-blue/20 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-xl">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">🔒 Privacy First</h3>
              </div>
              <p className="text-text-secondary leading-relaxed">
                We don't store your files or chats. Your legal data stays secure, respecting Indian privacy standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-accent-blue to-accent-cyan py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex p-3 bg-white/20 rounded-xl mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                ⚖️ Built for India
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-6">
                Trained on Indian laws, acts, clauses, and contracts — not just global data. Made for Indian citizens, by Indian innovators.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/chatbot"
                className="inline-flex items-center px-8 py-4 bg-white text-accent-blue font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Globe className="h-5 w-5 mr-2" />
                Try Our Platform
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
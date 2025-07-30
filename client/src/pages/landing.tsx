import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Users, Zap, BarChart3, Bell, Columns, Mail, MessageSquare, FileText, Ticket, HardDrive, ArrowRight, CheckCircle, Star, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
      
      {/* Fixed Navigation Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Cognitive Offload
              </span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors font-medium">Features</a>
              <a href="#integrations" className="text-gray-300 hover:text-white transition-colors font-medium">Integrations</a>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105">
                  Get Started
                </Button>
              </Link>
            </div>
            
            <Button variant="ghost" size="sm" className="md:hidden text-gray-300 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center relative">
            {/* Floating geometric shapes */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-green-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>

            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Stop Drowning in
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                Information
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Transform scattered communications from Gmail, Slack, Notion, and Jira into{' '}
              <span className="font-semibold text-blue-400">organized, prioritized, actionable insights</span>
            </motion.p>
            
            {/* Problem Statistics - Redesigned */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {[
                { number: "200+", label: "Messages/day", icon: MessageSquare, color: "text-red-400" },
                { number: "50+", label: "Emails/day", icon: Mail, color: "text-orange-400" },
                { number: "0", label: "Focused hours", icon: Brain, color: "text-yellow-400" },
                { number: "100%", label: "Chaos", icon: Zap, color: "text-red-500" }
              ].map((stat, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.number}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link href="/auth">
                <Button className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Your Cognitive Offload
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-gray-400 text-sm">Free forever • No credit card required</p>
            </motion.div>
          </div>

          {/* Demo Preview */}
          <motion.div 
            className="mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 shadow-2xl">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm ml-4">Cognitive Offload Dashboard</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="text-red-400 font-semibold flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      🔥 Urgent
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-white border-l-4 border-red-500">
                      <div className="flex items-center mb-2">
                        <Mail className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-xs text-gray-400">Gmail</span>
                      </div>
                      <p className="font-medium">Client presentation needs final slides by Friday 3PM</p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Today
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-white border-l-4 border-red-500">
                      <div className="flex items-center mb-2">
                        <MessageSquare className="w-4 h-4 text-purple-400 mr-2" />
                        <span className="text-xs text-gray-400">Slack</span>
                      </div>
                      <p className="font-medium">Production server down - need immediate help</p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Now
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-blue-400 font-semibold flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      💡 FYI
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-white border-l-4 border-blue-500">
                      <div className="flex items-center mb-2">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-xs text-gray-400">Notion</span>
                      </div>
                      <p className="font-medium">Q1 roadmap updated with new priorities</p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        This week
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-white border-l-4 border-blue-500">
                      <div className="flex items-center mb-2">
                        <Mail className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-xs text-gray-400">Gmail</span>
                      </div>
                      <p className="font-medium">Weekly sync notes and planning discussion</p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Tomorrow
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-gray-400 font-semibold flex items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                      🗑 Ignore
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-white border-l-4 border-gray-500 opacity-50">
                      <div className="flex items-center mb-2">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-xs text-gray-400">Gmail</span>
                      </div>
                      <p className="font-medium">Marketing email about new tools</p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        Yesterday
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">AI-Powered Intelligence for Modern Work</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our advanced AI processes every communication to extract what matters most
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Smart Classification",
                description: "AI automatically sorts communications into Urgent, FYI, or Ignore categories based on content, sender, and context.",
                tags: ["🔥 Urgent", "💡 FYI", "🗑 Ignore"]
              },
              {
                icon: BarChart3,
                title: "Action Extraction",
                description: "Converts vague requests into specific, actionable tasks with clear deliverables and deadlines.",
                example: '"Can you help with the report?" → "Create Q4 sales report by Friday 3PM"'
              },
              {
                icon: Users,
                title: "Context Mapping",
                description: "Connects related messages, documents, and tasks across all platforms for complete context understanding.",
                icons: [Mail, MessageSquare, FileText, Ticket]
              },
              {
                icon: Zap,
                title: "Real-time Processing",
                description: "Live updates as new communications arrive, with instant AI processing and dashboard refresh."
              },
              {
                icon: Columns,
                title: "Unified Dashboard",
                description: "Single interface for all your workplace communications with intelligent prioritization and quick actions."
              },
              {
                icon: Bell,
                title: "Smart Notifications",
                description: "Intelligent notification system that respects focus time and only alerts for truly urgent items."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="text-blue-400 h-6 w-6" />
                    </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                    {feature.tags && (
                      <div className="flex flex-wrap gap-2">
                        {feature.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full border border-white/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {feature.example && (
                    <div className="text-sm text-gray-400 italic bg-white/5 rounded-lg p-3 mt-3">
                        {feature.example}
                      </div>
                    )}
                    {feature.icons && (
                    <div className="flex space-x-3 mt-4">
                        {feature.icons.map((Icon, i) => (
                        <Icon key={i} className="h-5 w-5 text-gray-400" />
                        ))}
                      </div>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Seamlessly Connects Your Entire Workflow</h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              One-click OAuth integration with all your essential productivity tools
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center">
            {[
              { name: "Gmail", icon: Mail, color: "text-red-400" },
              { name: "Slack", icon: MessageSquare, color: "text-purple-400" },
              { name: "Notion", icon: FileText, color: "text-gray-300" },
              { name: "Jira", icon: Ticket, color: "text-blue-400" },
              { name: "Drive", icon: HardDrive, color: "text-green-400" }
            ].map((integration, index) => (
              <motion.div
                key={integration.name}
                className="flex flex-col items-center bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <integration.icon className={`h-12 w-12 ${integration.color} mb-3`} />
                <span className="font-medium text-white">{integration.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Reclaim Your Focus?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of professionals who have transformed their productivity with AI-powered intelligence.
            </p>
            <Link href="/auth">
              <Button className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                <Zap className="mr-2 h-5 w-5" />
                Start Your Cognitive Offload
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-gray-400 text-sm mt-4">Free forever • No credit card required</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

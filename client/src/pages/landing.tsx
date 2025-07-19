import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Users, Zap, BarChart3, Bell, Columns, Mail, MessageSquare, FileText, Ticket, HardDrive } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 overflow-x-hidden">
      
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 glassmorphism">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Brain className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Cognitive Offload WorkOS
              </span>
            </motion.div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors">Features</a>
              <a href="#integrations" className="text-gray-700 hover:text-purple-600 transition-colors">Integrations</a>
              <Link href="/auth">
                <Button className="gradient-primary text-white font-medium hover-lift">
                  Get Started
                </Button>
              </Link>
            </div>
            <Button variant="ghost" size="sm" className="md:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center relative">
            {/* Floating geometric shapes */}
            <div className="floating-shape floating-shape-1"></div>
            <div className="floating-shape floating-shape-2"></div>
            <div className="floating-shape floating-shape-3"></div>

            <motion.h1 
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Stop Drowning in Information
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Transform scattered communications from Gmail, Slack, Notion, and Jira into{' '}
              <span className="font-semibold text-purple-600">organized, prioritized, actionable insights</span>
            </motion.p>
            
            {/* Problem Statistics */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {[
                { number: "200+", label: "Slack messages/day", color: "text-red-500" },
                { number: "50+", label: "Emails/day", color: "text-orange-500" },
                { number: "Dozens", label: "Tool updates", color: "text-yellow-500" },
                { number: "Zero", label: "Focused work time", color: "text-red-600" }
              ].map((stat, index) => (
                <Card key={index} className="glassmorphism hover-lift">
                  <CardContent className="p-6 text-center">
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link href="/auth">
                <Button className="px-8 py-4 text-lg font-semibold text-white gradient-primary rounded-xl hover-lift transform transition-all duration-200 hover:scale-105">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Your Cognitive Offload
                </Button>
              </Link>
              <p className="text-sm text-gray-500">No credit card required • 14-day free trial</p>
            </motion.div>
          </div>

          {/* Demo Preview */}
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="max-w-6xl mx-auto overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm ml-4">WorkOS Dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-white">
                  <div className="space-y-2">
                    <div className="text-red-400 font-medium">🔥 Urgent</div>
                    <div className="bg-gray-800 rounded-lg p-3 text-sm">Client presentation needs final slides...</div>
                    <div className="bg-gray-800 rounded-lg p-3 text-sm">Production server down - need help...</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-blue-400 font-medium">💡 FYI</div>
                    <div className="bg-gray-800 rounded-lg p-3 text-sm">Q1 roadmap updated with priorities...</div>
                    <div className="bg-gray-800 rounded-lg p-3 text-sm">Weekly sync notes and planning...</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-gray-400 font-medium">🗑 Ignore</div>
                    <div className="bg-gray-800 rounded-lg p-3 text-sm opacity-50">Marketing email about tools...</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered Intelligence for Modern Work</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                <Card className="glassmorphism hover-lift h-full">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                      <feature.icon className="text-white h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    {feature.tags && (
                      <div className="flex flex-wrap gap-2">
                        {feature.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {feature.example && (
                      <div className="text-sm text-gray-500 italic">
                        {feature.example}
                      </div>
                    )}
                    {feature.icons && (
                      <div className="flex space-x-2 text-sm">
                        {feature.icons.map((Icon, i) => (
                          <Icon key={i} className="h-4 w-4 text-gray-500" />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Seamlessly Connects Your Entire Workflow</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              One-click OAuth integration with all your essential productivity tools
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center">
            {[
              { name: "Gmail", icon: Mail, color: "text-red-500" },
              { name: "Slack", icon: MessageSquare, color: "text-purple-500" },
              { name: "Notion", icon: FileText, color: "text-gray-700" },
              { name: "Jira", icon: Ticket, color: "text-blue-500" },
              { name: "Drive", icon: HardDrive, color: "text-green-500" }
            ].map((integration, index) => (
              <motion.div
                key={integration.name}
                className="flex flex-col items-center glassmorphism rounded-2xl p-6 hover-lift"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <integration.icon className={`h-12 w-12 ${integration.color} mb-3`} />
                <span className="font-medium text-gray-700">{integration.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Reclaim Your Focus?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of professionals who have transformed their productivity with AI-powered intelligence.
            </p>
            <Link href="/auth">
              <Button className="px-8 py-4 text-lg font-semibold text-white gradient-primary rounded-xl hover-lift transform transition-all duration-200 hover:scale-105">
                <Zap className="mr-2 h-5 w-5" />
                Start Your Free Trial
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">No credit card required • Setup in under 2 minutes</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

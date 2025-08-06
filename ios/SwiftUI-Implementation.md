# Swift UI Implementation Guide

## 🎯 Overview
This guide shows how to build a native SwiftUI version of your Aqeel app that connects to your existing Supabase backend.

## 📋 Prerequisites
- Xcode 15.0+
- iOS 16.0+
- Swift 5.9+
- Your existing Supabase project

## 🏗️ Project Structure
```
AqeelSwift/
├── App/
│   ├── AqeelApp.swift
│   └── ContentView.swift
├── Views/
│   ├── ChatView.swift
│   ├── SessionListView.swift
│   ├── ActionItemsView.swift
│   └── SettingsView.swift
├── Models/
│   ├── ChatMessage.swift
│   ├── Session.swift
│   └── ActionItem.swift
├── Services/
│   ├── SupabaseService.swift
│   ├── OpenAIService.swift
│   └── AuthService.swift
└── Utils/
    ├── Extensions.swift
    └── Constants.swift
```

## 🚀 Implementation Steps

### 1. Create New SwiftUI Project
1. Open Xcode
2. Create new iOS app project
3. Choose SwiftUI for interface
4. Set minimum deployment target to iOS 16.0

### 2. Add Dependencies
Add these to your `Package.swift`:
```swift
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
    .package(url: "https://github.com/MacPaw/OpenAI", from: "0.2.4"),
]
```

### 3. Basic App Structure
```swift
// AqeelApp.swift
import SwiftUI

@main
struct AqeelApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
```

### 4. Main Content View
```swift
// ContentView.swift
import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ChatView()
                .tabItem {
                    Image(systemName: "message")
                    Text("Chat")
                }
                .tag(0)
            
            ActionItemsView()
                .tabItem {
                    Image(systemName: "checkmark.square")
                    Text("Actions")
                }
                .tag(1)
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
                .tag(2)
        }
        .accentColor(.blue)
    }
}
```

### 5. Chat View (Main Interface)
```swift
// ChatView.swift
import SwiftUI

struct ChatView: View {
    @StateObject private var chatService = ChatService()
    @State private var messageText = ""
    @State private var showSessionList = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header
                HStack {
                    Button(action: { showSessionList.toggle() }) {
                        Image(systemName: "line.horizontal.3")
                            .font(.title2)
                            .foregroundColor(.white)
                    }
                    
                    Spacer()
                    
                    VStack {
                        Text("Aqeel")
                            .font(.headline)
                            .fontWeight(.bold)
                        Text("AI Assistant")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Button(action: { chatService.createNewSession() }) {
                        Image(systemName: "plus")
                            .font(.title2)
                            .foregroundColor(.white)
                    }
                }
                .padding()
                .background(.ultraThinMaterial)
                
                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(chatService.messages) { message in
                                MessageBubble(message: message)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: chatService.messages.count) { _ in
                        if let lastMessage = chatService.messages.last {
                            withAnimation {
                                proxy.scrollTo(lastMessage.id, anchor: .bottom)
                            }
                        }
                    }
                }
                
                // Input
                HStack(spacing: 12) {
                    TextField("Type your message...", text: $messageText, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(1...4)
                    
                    Button(action: sendMessage) {
                        Image(systemName: "paperplane.fill")
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .purple],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(Circle())
                    }
                    .disabled(messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding()
                .background(.ultraThinMaterial)
            }
            .background(
                LinearGradient(
                    colors: [.black, .gray.opacity(0.8)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
        }
        .sheet(isPresented: $showSessionList) {
            SessionListView(chatService: chatService)
        }
    }
    
    private func sendMessage() {
        let message = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty else { return }
        
        chatService.sendMessage(message)
        messageText = ""
    }
}
```

### 6. Message Bubble Component
```swift
// MessageBubble.swift
import SwiftUI

struct MessageBubble: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser {
                Spacer(minLength: 60)
            }
            
            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 4) {
                HStack(spacing: 8) {
                    if !message.isUser {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.purple, .pink],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 32, height: 32)
                            .overlay {
                                Image(systemName: "brain")
                                    .foregroundColor(.white)
                                    .font(.system(size: 14))
                            }
                    }
                    
                    Text(message.content)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(
                            message.isUser ?
                            LinearGradient(colors: [.blue, .blue.opacity(0.8)], startPoint: .leading, endPoint: .trailing) :
                            LinearGradient(colors: [.gray.opacity(0.3), .gray.opacity(0.2)], startPoint: .leading, endPoint: .trailing)
                        )
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                    
                    if message.isUser {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.blue, .blue.opacity(0.8)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 32, height: 32)
                            .overlay {
                                Image(systemName: "person.fill")
                                    .foregroundColor(.white)
                                    .font(.system(size: 14))
                            }
                    }
                }
                
                Text(message.timestamp.formatted(date: .omitted, time: .shortened))
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, message.isUser ? 0 : 40)
            }
            
            if !message.isUser {
                Spacer(minLength: 60)
            }
        }
        .id(message.id)
    }
}
```

### 7. Data Models
```swift
// ChatMessage.swift
import Foundation

struct ChatMessage: Identifiable, Codable {
    let id = UUID()
    let content: String
    let isUser: Bool
    let timestamp: Date
    let sessionId: String?
    
    init(content: String, isUser: Bool, sessionId: String? = nil) {
        self.content = content
        self.isUser = isUser
        self.timestamp = Date()
        self.sessionId = sessionId
    }
}

// Session.swift
struct ChatSession: Identifiable, Codable {
    let id: String
    let title: String
    let summary: String?
    let createdAt: Date
    let updatedAt: Date
    let messageCount: Int
}

// ActionItem.swift
struct ActionItem: Identifiable, Codable {
    let id: String
    let text: String
    let completed: Bool
    let priority: Priority
    let createdAt: Date
    
    enum Priority: String, CaseIterable, Codable {
        case low, medium, high, urgent
        
        var color: Color {
            switch self {
            case .low: return .green
            case .medium: return .yellow
            case .high: return .orange
            case .urgent: return .red
            }
        }
    }
}
```

### 8. Supabase Service
```swift
// SupabaseService.swift
import Foundation
import Supabase

class SupabaseService: ObservableObject {
    static let shared = SupabaseService()
    
    private let client: SupabaseClient
    
    init() {
        self.client = SupabaseClient(
            supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
            supabaseKey: "YOUR_SUPABASE_ANON_KEY"
        )
    }
    
    // MARK: - Sessions
    func getSessions() async throws -> [ChatSession] {
        let response: [ChatSession] = try await client
            .from("sessions")
            .select()
            .execute()
            .value
        return response
    }
    
    func createSession(_ session: ChatSession) async throws -> ChatSession {
        let response: ChatSession = try await client
            .from("sessions")
            .insert(session)
            .single()
            .execute()
            .value
        return response
    }
    
    // MARK: - Messages
    func getMessages(for sessionId: String) async throws -> [ChatMessage] {
        // Implementation for fetching messages
        // Connect to your interactions table
        return []
    }
    
    // MARK: - Action Items
    func getActionItems() async throws -> [ActionItem] {
        let response: [ActionItem] = try await client
            .from("action_items")
            .select()
            .execute()
            .value
        return response
    }
}
```

## 🎨 SwiftUI Advantages for Your App

### 1. **Native iOS Features**
- ✅ **Haptic Feedback** for interactions
- ✅ **Native Navigation** with smooth transitions
- ✅ **iOS Widgets** for quick actions
- ✅ **Siri Integration** for voice commands
- ✅ **Face ID/Touch ID** for authentication

### 2. **Performance Benefits**
- ✅ **60fps animations** by default
- ✅ **Lazy loading** for large lists
- ✅ **Memory efficient** rendering
- ✅ **Native scrolling** performance

### 3. **iOS Integration**
- ✅ **Share Extension** for saving content
- ✅ **Shortcuts App** integration
- ✅ **Live Activities** for ongoing tasks
- ✅ **Push Notifications** with rich content
- ✅ **Apple Watch** companion app

## 🚀 Next Steps

1. **Start with Core Features**
   - Chat interface with message bubbles
   - Session management
   - Basic action items

2. **Add Advanced Features**
   - Real-time sync with Supabase
   - Offline support with Core Data
   - Push notifications

3. **iOS-Specific Enhancements**
   - Widgets for quick task access
   - Siri shortcuts for common actions
   - Apple Watch companion

Would you like me to help you implement any specific part of the SwiftUI version?
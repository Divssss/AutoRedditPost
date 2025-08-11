

## Project info

# Reddit AI Auto-Poster
*Automate Reddit content creation and scheduling with AI-powered campaigns.*

## Description
Reddit AI Auto-Poster is a web dashboard that lets users create, manage, and schedule automated Reddit posting campaigns. It combines OAuth-enabled Reddit access, AI-generated content, and serverless scheduling to streamline publishing. Key features include campaign management, dynamic post generation via OpenAI, user authentication, and timed dispatch using edge functions.

## Key Features
- OAuth integration with Reddit for secure account access.
- AI-generated titles and post bodies based on user-defined keywords using OpenAI’s API.
- Campaign management interface built in React for organizing and previewing scheduled posts.
- User authentication and metadata persistence handled via Supabase.
- Edge Functions for scheduling and dispatching Reddit posts.
- (In progress) Advanced scheduling module to queue and distribute posts at configurable intervals.

## Technologies Used
- React  
- TypeScript  
- OpenAI API  
- Supabase (auth + storage + metadata)  
- Edge Functions (for scheduling & dispatch)  
- Vite  
- shadcn-ui  
- Tailwind CSS  



**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.





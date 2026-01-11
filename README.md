# 🎬 Entertainment Tracker

[![Live Demo](https://img.shields.io/badge/Live-Demo-2ea44f)](https://entertainment.lahlou.tech)

**Entertainment Tracker** is a comprehensive, all-in-one personal media library application designed to help users track, organize, and analyze their consumption of various entertainment media. Whether it's movies, TV series, anime, manga, novels, or video games, this application provides a centralized hub to manage it all.

👉 **Live Website:** [entertainment.lahlou.tech](https://entertainment.lahlou.tech)


## 🏠 Why Self-Host?

> **Stop relying on external services like Trakt or MAL.** Take control of your data and self-host your own comprehensive media tracker.

This project is built for those who value digital sovereignty. By self-hosting **Entertainment Tracker**, you ensure:
*   **Total Privacy**: Your consumption data stays on your machine. No tracking, no ads, no algorithms.
*   **Data Ownership**: You are not at the mercy of a third-party service shutting down or changing its terms.
*   **Customizability**: Modify the code, database, and features to fit your exact needs.

Built with a focus on user experience and visual analytics, it offers sophisticated tracking capabilities.


## ✨ Key Features

*   **Universal Media Tracking**: A unified system to track 6 distinct media types:
    *   Movies 🎬
    *   Series 📺
    *   Anime 🌸
    *   Manga 📖
    *   Novels 📚
    *   Games 🎮
*   **Smart Dashboard**: The Home page dynamically aggregates "Community Favorites," showcasing trending items based on what users on the server are actively watching and playing.
*   **dedicated "My List" Management**: A personal library view that separates your content from discovery feeds, ensuring a focused organizing experience.
*   **Granular Status Tracking**: Custom status categorization tailored to each media type (e.g., "Watching" for Anime vs. "Playing" for Games vs. "Reading" for Novels).
*   **Visual Analytics**: A robust "Stats" page featuring:
    *   **Distribution Charts**: Doughnut charts visualizing your library composition.
    *   **Stacked Status Bars**: Detailed bar charts breaking down your statuses (e.g., Plan to Watch, Completed) by specific media types.
*   **Secure Authentication**: User accounts protected by JWT (JSON Web Token) authentication.
*   **Responsive Design**: A modern, dark-themed UI that works seamlessly across desktop and mobile devices.

## �️ Privacy & Security

**Your Privacy is Paramount.**
Unlike cloud-based services that track your every move, this application is built to keep your data in your hands. To maximize your privacy protection, we recommend the following best practices:
*   **Use Proxies**: Route your connection to external APIs (TMDB, RAWG, Jikan) through a proxy to mask your origin.
*   **De-link Identities**: Use different, anonymous email addresses when creating accounts for API keys. This prevents data aggregators from building a profile of you across different services.
*   **Zero Telemetry**: This application contains no tracking code or analytics. What you watch, play, or read is your business alone.

## �🛠️ Technology Stack

This project leverages a lightweight and efficient stack:

*   **Frontend**: HTML5, CSS3, Vanilla JavaScript
*   **Backend**: Node.js, Express.js
*   **Data Storage**: JSON-based local storage (NoSQL-style structure)
*   **Visualization**: Chart.js for data analytics
*   **External APIs**: Integration with TMDB (Movies/TV), Jikan (Anime/Manga), and RAWG (Games)

## 🚀 Installation & Setup

Follow these steps to run the project locally:

1.  **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) installed on your machine.
2.  **Clone the Repository**:
    ```bash
    git clone https://github.com/JAWAD4HAM/entertainment-tracker.git
    cd entertainment-tracker
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Configuration**:
    *   Create a `.env` file in the root directory.
    *   Add your API keys (TMDB, RAWG) and a JWT Secret:
        ```env
        PORT=3000
        JWT_SECRET=your_super_secret_key
        TMDB_API_KEY=your_tmdb_key
        RAWG_API_KEY=your_rawg_key
        ```
5.  **Start the Server**:
    ```bash
    node server.js
    ```
6.  **Access the App**: Open your browser and navigate to `http://localhost:3000`.

## 📂 Project Structure

```
entertainment-tracker/
├── assets/          # Static assets (CSS, JS, Images)
├── components/      # Reusable HTML components (Navbar, Footer)
├── middleware/      # Express middleware (Authentication)
├── pages/           # HTML views (Home, Stats, Login, MyList)
├── routes/          # API Route handlers (Auth, Search, List)
├── storage/         # JSON Data storage (Users, Lists)
├── server.js        # Entry point and server configuration
└── package.json     # Project dependencies
```

## 🔮 Future Improvements

*   **Expanded Media Support**: Support for **Books** 📚, **Podcasts** 🎙️, **Music** 🎵, **Comics & Graphic Novels** 💥, and **Web Novels** 🕸️.
*   **Database Migration**: Moving from JSON file storage to MongoDB for scalability.

## 👥 Authors

*   **Aymen / Jawad** - *Lead Developer*

---
*Submitted as a project for a CRUD application.*

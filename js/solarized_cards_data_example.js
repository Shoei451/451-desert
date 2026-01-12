// Example data structure for section 1
const sectionItems1 = [
    {
        icon: "📚",
        title: "学習ツール",
        titleEN: "Learning Tools",
        description: "効率的な学習をサポートするツール集",
        link: "tools.html"
    },
    {
        icon: "../images/favicon.png",  // Image icon example
        iconType: "image",
        title: "画像アイコンの例",
        titleEN: "Image Icon Example",
        description: "PNG/JPGアイコンを使った例",
        link: "item2.html"
    },
    {
        icon: "🌐",
        title: "外部リンク",
        titleEN: "External Link",
        description: "外部サイトへのリンク（自動で新しいタブで開く）",
        link: "https://github.com"  // External links auto-open in new tab
    },
    {
        icon: "🚀",
        title: "新しいタブで開く",
        titleEN: "Open in New Tab",
        description: "target指定で新しいタブで開く内部リンク",
        link: "item3.html",
        target: "_blank"  // Force new tab even for internal links
    }
];

// Example data structure for section 2
const sectionItems2 = [
    {
        icon: "📝",
        title: "メモアプリ",
        titleEN: "Note Taking App",
        description: "シンプルで使いやすいメモアプリ",
        link: "notes.html"
    },
    {
        icon: "📊",
        title: "データ分析",
        titleEN: "Data Analysis",
        description: "データを視覚化して分析するツール",
        link: "analytics.html"
    },
    {
        icon: "📖",
        title: "ドキュメント",
        titleEN: "Documentation",
        description: "詳しい使い方やガイドライン",
        link: "docs.html"
    }
];

// Example data structure for section 3 (optional)
const sectionItems3 = [
    {
        icon: "💡",
        title: "チュートリアル",
        titleEN: "Tutorials",
        description: "初心者向けのステップバイステップガイド",
        link: "tutorials.html"
    },
    {
        icon: "🎓",
        title: "コース",
        titleEN: "Courses",
        description: "体系的に学べるコース教材",
        link: "courses.html"
    }
];
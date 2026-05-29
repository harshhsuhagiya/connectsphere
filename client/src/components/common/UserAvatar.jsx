import React from "react";

const colors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
];

const Avatar = ({ name = "", src = "", size = "md", className = "" }) => {
  // Size mapping
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
    xl: "w-32 h-32 text-5xl",
  };

  const dimensions = sizeClasses[size] || sizeClasses.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name || "User Avatar"}
        className={`${dimensions} rounded-full object-cover ${className}`}
      />
    );
  }

  // First letter capital, default to "U" if no name provided
  const firstLetter = name ? name.charAt(0).toUpperCase() : "U";

  // Random color based on name
  const colorIndex = name ? name.length % colors.length : 0;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`${dimensions} rounded-full flex items-center justify-center text-white font-bold ${bgColor} ${className}`}
    >
      {firstLetter}
    </div>
  );
};

export default Avatar;
import { useParams } from "react-router-dom";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import PostCard from "../components/PostCard";
import "../styles/SubmitPage.css";

const ProfilePage = () => {
  const { username } = useParams();
  const {results: posts, loadMore, status} = usePaginatedQuery(api.post.userPosts, {
    authorUsername: username || "",
  }, {initialNumItems: 20});
  const stats = useQuery(api.users.getPublicUser, {username: username || ""})

  if (posts === undefined)
    return (
      <div className="content-container">
        <div className="profile-header">
          <h1>u/{username}</h1>
        </div>
        <div className="loading">Loading posts...</div>
      </div>
    );

  return (
    <div className="content-container">
      <div className="profile-header">
        <h1>u/{username}</h1>
        <p style={{ color: "#7c7c7c" }}>Posts: {stats?.posts ?? 0}</p>
      </div>
      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} showSubreddit={true} />
          ))
        )}
        {status === "CanLoadMore" && (
          <button className="load-more" onClick={() => loadMore(20)}>
            Load More
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

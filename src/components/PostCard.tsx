import { FaRegCommentAlt, FaTrash } from "react-icons/fa";
import { TbArrowBigUp, TbArrowBigDown } from "react-icons/tb";
import { Link, useNavigate } from "react-router-dom";
import { PaginationStatus, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import Comment from "./Comment";
import "../styles/PostCard.css";
import { useState } from "react";

interface Post {
  _id: Id<"post">;
  subject: string;
  body: string;
  _creationTime: number;
  authorId: string;
  imageUrl?: string;
  author?: {
    username: string;
  };
  subreddit?: {
    name: string;
  };
}

interface PostCardProps {
  post: Post;
  showSubreddit?: boolean;
  expandedView?: boolean;
}

interface PostHeaderProps {
  author?: { username: string };
  subreddit: { name: string };
  showSubreddit: boolean;
  creationTime: number;
}

interface PostContentProps {
  subject: string;
  body?: string;
  image?: string;
  expandedView: boolean;
}

interface CommentSectionProps {
  postId: Id<"post">;
  comments: Doc<"comments">[];
  onSubmit: (content: string) => void;
  signedIn: boolean;
  loadMore: (numItems: number) => void;
  status: PaginationStatus;
}

interface VoteButtonsProps {
  voteCounts: { total: number; upvotes: number; downvotes: number } | undefined;
  hasUpvoted: boolean | undefined;
  hasDownvoted: boolean | undefined;
  onUpvote: () => void;
  onDownvote: () => void;
}

const VoteButtons = ({
  voteCounts,
  hasUpvoted,
  hasDownvoted,
  onUpvote,
  onDownvote,
}: VoteButtonsProps) => {
  return (
    <div className="post-votes">
      <span className="vote-count upvote-count">
        {voteCounts?.upvotes ?? 0}
      </span>
      <button
        className={`vote-button ${hasUpvoted ? "voted" : ""}`}
        onClick={onUpvote}
      >
        <TbArrowBigUp size={24} />
      </button>
      <span className="vote-count total-count">{voteCounts?.total ?? 0}</span>
      <span className="vote-count downvote-count">
        {voteCounts?.downvotes ?? 0}
      </span>
      <button
        className={`vote-button ${hasDownvoted ? "voted" : ""}`}
        onClick={onDownvote}
      >
        <TbArrowBigDown size={24} />
      </button>
    </div>
  );
};

const PostHeader = ({
  author,
  subreddit,
  showSubreddit,
  creationTime,
}: PostHeaderProps) => {
  return (
    <div className="post-header">
      {author ? (
        <Link to={`/u/${author.username}`}>u/{author.username}</Link>
      ) : (
        <span className="post-author">u/deleted</span>
      )}

      {showSubreddit && subreddit && (
        <>
          <span className="post-dot">-</span>
          <Link to={`/r/${subreddit.name}`} className="post-subreddit">
            r/{subreddit.name}
          </Link>
        </>
      )}
      <span className="post-dot">-</span>
      <span className="post-timestamp">
        {new Date(creationTime).toLocaleString()}
      </span>
    </div>
  );
};

const PostContent = ({
  subject,
  body,
  image,
  expandedView,
}: PostContentProps) => {
  return (
    <>
      {expandedView ? (
        <>
          <h1 className="post-title">{subject}</h1>
          {image && (
            <div className="post-image-container">
              <img src={image} alt="Post content" className="post-image" />
            </div>
          )}
          {body && <p className="post-body">{body}</p>}
        </>
      ) : (
        <div className="preview-post">
          <div>
            <h2 className="post-title">{subject}</h2>
            {body && <p className="post-body">{body}</p>}
          </div>
          {image && (
            <div className="post-image-container small-img">
              <img src={image} alt="Post content" className="post-image" />
            </div>
          )}
        </div>
      )}
    </>
  );
};

const CommentSection = ({
  comments,
  onSubmit,
  signedIn,
  loadMore,
  status,
}: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onSubmit(newComment.trim());
    setNewComment("");
  };

  return (
    <div className="comments-section">
      {signedIn && (
        <form className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            className="comment-input"
          />
          <button
            type="submit"
            className="comment-submit"
            onClick={handleSubmit}
            disabled={!newComment}
          >
            Comment
          </button>
        </form>
      )}
      <div className="comments-list">
        {comments?.map((comment) => (
          <Comment key={comment._id} comment={comment} />
        ))}
      </div>
      {status === "CanLoadMore" && (
        <button className="load-more" onClick={() => loadMore(20)}>
          Load More
        </button>
      )}
    </div>
  );
};

const PostCard = ({
  post,
  showSubreddit = false,
  expandedView = false,
}: PostCardProps) => {
  const [showComments, setShowComments] = useState(expandedView);
  const navigate = useNavigate();
  const { user } = useUser();
  const ownedByCurrentUser = post.author?.username === user?.username;

  const deletePost = useMutation(api.post.deletePost);
  const createComment = useMutation(api.comments.create);
  const toggleUpvote = useMutation(api.vote.toggleUpvote)
  const toggleDownvote = useMutation(api.vote.toggleDownvote)

  const voteCounts = useQuery(api.vote.getVoteCounts, {postId: post._id})
  const hasUpvoted = useQuery(api.vote.hasUpvoted, {postId: post._id})
  const hasDownvoted = useQuery(api.vote.hasDownvoted, {postId: post._id})

  const {results: comments, loadMore, status} = usePaginatedQuery(api.comments.getComments, { postId: post._id }, {initialNumItems: 20});
  const commentCount = useQuery(api.comments.getCommentCount, {
    postId: post._id,
  });

  const onUpvote = () => toggleUpvote({postId: post._id})
  const onDownvote = () => toggleDownvote({postId: post._id})

  const handleComment = () => {
    if (!expandedView) {
      navigate(`/post/${post._id}`);
    } else {
      setShowComments(!showComments);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you would like to delete this?")) {
      await deletePost({ id: post._id });
      if (expandedView) {
        navigate("/");
      }
    }
  };

  const handleSubmitComment = (content: string) => {
    createComment({
      content,
      postId: post._id,
    });
  };

  return (
    <div className={`post-card ${expandedView ? "expanded" : ""}`}>
        <VoteButtons 
            voteCounts={voteCounts}
            hasUpvoted={hasUpvoted}
            hasDownvoted={hasDownvoted}
            onUpvote={user ? onUpvote : () => {}}
            onDownvote={user ? onDownvote : () => {}}
        />
      <div className="post-content">
        <PostHeader
          author={post.author}
          subreddit={post.subreddit ?? { name: "deleted" }}
          showSubreddit={showSubreddit}
          creationTime={post._creationTime}
        />
        <PostContent
          subject={post.subject}
          body={post.body}
          image={post.imageUrl}
          expandedView={expandedView}
        />
        <div className="post-actions">
          <button className="action-button" onClick={handleComment}>
            <FaRegCommentAlt />
            <span>{commentCount ?? 0} Comments</span>
          </button>
          {ownedByCurrentUser && (
            <button
              className="action-button delete-button"
              onClick={handleDelete}
            >
              <FaTrash />
              <span>Delete</span>
            </button>
          )}
        </div>
        {(showComments || expandedView) && (
          <CommentSection
            postId={post._id}
            comments={comments ?? []}
            onSubmit={handleSubmitComment}
            signedIn={!!user}
            loadMore={loadMore}
            status={status}
          />
        )}
      </div>
    </div>
  );
};

export default PostCard;

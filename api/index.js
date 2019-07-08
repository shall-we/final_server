const UserAPI = require("./user");
const FolderAPI = require("./folder");
const NoteAPI = require("./note");
const NoticeAPI = require("./notice");
const AttachmentAPI = require("./attachment");
const AnnouncementAPI = require("./announcement");
const Common = require("./common");
const FriendAPI = require("./friend");
const ChatAPI = require("./chat");

let router = require("express").Router();

router.all("/*", Common.checkToken);

// User
router.post("/join", UserAPI.register);
router.post("/login", UserAPI.login);
router.get("/user", UserAPI.getUserList);
router.get("/userExceptFriend", UserAPI.getUserListExceptMyFriend);
router.get("/autoLogin", UserAPI.autoLogin);
router.get("/logout", UserAPI.logout);

// Folder
router.post("/folder", FolderAPI.register);
router.post("/folder/shared", FolderAPI.share);
router.delete("/folder/shared/:folder_id/:user_id", FolderAPI.unshare);
router.get("/folder/shared", FolderAPI.getSharedList);
router.get("/folder/private", FolderAPI.getPrivateList);
router.delete("/folder/:id", FolderAPI.delete);
router.patch("/folder/:id/:name", FolderAPI.updateFolderName);

// Note
router.get("/note/list", NoteAPI.getNoteList);
router.get("/note/searchlist",NoteAPI.getSearchNoteList);
router.get("/note/deletedlist",NoteAPI.getDeletedNoteList);
router.post("/note", NoteAPI.register);
router.patch("/note/:id/:name", NoteAPI.updateNoteName);
router.patch("/note/status/:id/:status", NoteAPI.setStatus);
router.patch("/note/lock/:id/:lock", NoteAPI.setLock);
router.get("/note/status/", NoteAPI.noteStateCheck);

// Notice
router.post("/notice", NoticeAPI.create);
router.get("/notice", NoticeAPI.getNoticeList);
router.patch("/notice/:idx", NoticeAPI.deleteNoticeList);
router.patch("/notice/:to/:object/:type", NoticeAPI.updateNoticeList);


// Attachment
router.post("/attachment/create/:note_id", AttachmentAPI.create);
router.delete("/attachment/:id", AttachmentAPI.delete);
router.get("/attachment/list", AttachmentAPI.getAttachmentList);
router.post("/attachment/download", AttachmentAPI.downloadAttachment);

router.all("/admin/*", Common.checkAdmin);
// Announcement
router.get("/admin/announcement", AnnouncementAPI.getAnnouncementList);
router.post("/admin/announcement", AnnouncementAPI.register);
router.get("/admin/announcement/:id", AnnouncementAPI.getAnnouncement);
router.patch("/admin/announcement/:id", AnnouncementAPI.updateAnnouncement);
router.delete("/admin/announcement/:id", AnnouncementAPI.deleteAnnouncement);


//friend List
router.post("/friend/add", FriendAPI.insertFriend);
router.delete("/friend/delete", FriendAPI.deleteFriend);
router.get("/friend/getAllFriend", FriendAPI.searchAllFriendWithInfoAPI);


//getPrivateChatList
router.get("/chat/getSingleChat", ChatAPI.getSingleChat);
router.get("/chat/getChats", ChatAPI.getChats);
router.post("/chat/initChatroom", ChatAPI.initChatRoom);
router.post("/chat/inviteMultiChatroom", ChatAPI.inviteMultiChatroom);
router.patch("/chat/updateChatRoomTitle", ChatAPI.updateChatRoomTitle);

router.get("/chat/getChatParticipantsInfo", ChatAPI.getChatParticipantInfo);
router.get("/chat/getPrivateChatroomList", ChatAPI.getPrivateChatroomList);
router.get("/chat/countChatroom", ChatAPI.countChatroom);
router.patch("/chat/updateChatCheckTime", ChatAPI.updateChatCheckTime);
router.delete("/chat/dropChatroom", ChatAPI.dropChatRoom);

router.get("/admin/user", UserAPI.getAllUserList);
router.get("/admin/folder", UserAPI.getAllFolderList);
router.get("/admin/note", UserAPI.getAllNoteList);
router.delete("/admin/user/:id", UserAPI.deleteUser);
router.delete("/admin/note/:id", NoteAPI.permanentDeleteNote);




module.exports = router;

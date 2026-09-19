class MessageModel {
  final String id;
  final String senderId;
  final String senderName;
  final String text;
  final String timeLabel;
  final bool isMine;

  const MessageModel({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.timeLabel,
    required this.isMine,
  });
}

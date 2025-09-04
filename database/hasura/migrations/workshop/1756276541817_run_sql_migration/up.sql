-- 添加回复字段
ALTER TABLE public.message ADD COLUMN reply_to_uuid uuid;

-- 添加外键约束
ALTER TABLE public.message 
ADD CONSTRAINT message_reply_to_uuid_fkey 
FOREIGN KEY (reply_to_uuid) REFERENCES public.message(uuid) 
ON UPDATE CASCADE ON DELETE SET NULL;

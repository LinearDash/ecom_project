-- Run after schema.sql. Safe to rerun; existing products are preserved.
insert into public.products(id,name,category,price,stock,image_url,description) values
('00000000-0000-4000-8000-000000000001','The everyday notebook','Notebooks','380','24','/products/notebook.svg','Forest green cover, 160 ruled pages, and a lay-flat binding. A quiet place for your daily thoughts.'),
('00000000-0000-4000-8000-000000000002','Classic brass pen','Writing','650','18','/products/pen.svg','A reassuringly weighty brass ballpoint with smooth black ink and a refillable cartridge.'),
('00000000-0000-4000-8000-000000000003','Weekly desk planner','Notebooks','450','20','/products/planner.svg','An undated weekly planner with room for your priorities, appointments, and the little things.'),
('00000000-0000-4000-8000-000000000004','Wooden pencil set','Writing','180','40','/products/pencils.svg','Six natural wood HB pencils. Made for first drafts, quick sketches, and big ideas.'),
('00000000-0000-4000-8000-000000000005','Everyday canvas pouch','Desk essentials','520','15','/products/pouch.svg','A simple cotton canvas zip pouch to keep your favorite pens and pencils together.'),
('00000000-0000-4000-8000-000000000006','Pastel highlighters','Writing','280','30','/products/highlighters.svg','A set of three gentle pastel highlighters with a chisel tip for notes that stand out.'),
('00000000-0000-4000-8000-000000000007','Pocket notes trio','Notebooks','320','22','/products/pocket.svg','Three pocket-sized notebooks in soft earthy colors. Small enough to take anywhere.'),
('00000000-0000-4000-8000-000000000008','Watercolor palette','Art supplies','890','12','/products/watercolor.svg','Twelve watercolor pans in a compact case. Just add water and a little curiosity.'),
('00000000-0000-4000-8000-000000000009','Oak desk organizer','Desk essentials','1150','8','/products/organizer.svg','A warm wooden home for your pens, cards, and everyday desk essentials.'),
('00000000-0000-4000-8000-000000000010','Washi tape collection','Art supplies','240','25','/products/tape.svg','Three paper tapes for journal borders, gift wrapping, and adding a personal touch.'),
('00000000-0000-4000-8000-000000000011','Sketchbook, A5','Art supplies','480','16','/products/sketchbook.svg','Forty sheets of heavyweight uncoated paper for pencil, charcoal, and dry media.'),
('00000000-0000-4000-8000-000000000012','Brass page clips','Desk essentials','150','0','/products/clips.svg','A set of four brass-tone clips for marking favorite pages and keeping loose notes together.')
on conflict (id) do nothing;

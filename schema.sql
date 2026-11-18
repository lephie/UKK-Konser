create database if not exists konser_ukk;
use konser_ukk;

create table users (
    id int primary key auto_increment,
    name varchar(100) not null,
    email varchar(150) not null unique,
    password varchar(100) not null,
    phone varchar(20),
    role enum('superadmin','event_organizer','user') not null default 'user',
    is_active boolean not null default true,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp on update current_timestamp
);

create table concert (
    id int primary key auto_increment,
    title varchar(200) not null,
    description text,
    venue varchar(200) not null,
    location varchar(200) not null,
    date datetime not null,
    banner_url varchar(500),
    status enum('draft','published','cancelled') not null default 'draft',
    created_by int not null,
    created_at datetime default current_timestamp,
    index idx_concert_status_date (status, date),
    foreign key (created_by) references users(id) on delete cascade
);

create table ticket_tier (
    id int primary key auto_increment,
    concert_id int not null,
    name varchar(150) not null,
    price decimal(12,2) not null,
    quota int not null,
    sold int not null default 0,          -- paid tickets + tickets currently held by pending orders
    sale_start datetime,
    sale_end datetime,
    check (sold >= 0 and sold <= quota),   -- database-level guard against overselling
    foreign key (concert_id) references concert(id) on delete cascade
);

create table order_ticket (
    id int primary key auto_increment,
    user_id int not null,
    concert_id int not null,
    status enum('pending','paid','cancelled','expired') not null default 'pending',
    total_price decimal(12,2) not null default 0,
    payment_method varchar(60),           -- filled from Midtrans payment_type
    payment_token varchar(200),           -- Midtrans Snap token
    payment_ref varchar(100) unique,      -- order_id we send to Midtrans
    expires_at datetime not null,
    created_at datetime default current_timestamp,
    index idx_order_status_expires (status, expires_at),
    foreign key (concert_id) references concert(id) on delete cascade,
    foreign key (user_id) references users(id) on delete cascade
);

create table order_detail (
    id int primary key auto_increment,
    order_id int not null,
    ticket_tier_id int not null,
    quantity int not null,
    unit_price decimal(12,2) not null,
    subtotal decimal(12,2) not null,
    foreign key (order_id) references order_ticket(id) on delete cascade,
    foreign key (ticket_tier_id) references ticket_tier(id) on delete cascade
);

create table ticket (
    id int primary key auto_increment,
    order_detail_id int not null,
    user_id int not null,
    concert_id int not null,
    ticket_tier_id int not null,
    qr_code varchar(200) not null unique,
    status enum('unused','used','cancelled') not null default 'unused',
    check_in_at datetime null,
    checked_in_by int null,               -- the EO who scanned the ticket (was check_out_by, NOT NULL)
    foreign key (user_id) references users(id) on delete cascade,
    foreign key (concert_id) references concert(id) on delete cascade,
    foreign key (ticket_tier_id) references ticket_tier(id) on delete cascade,
    foreign key (order_detail_id) references order_detail(id) on delete cascade,
    foreign key (checked_in_by) references users(id) on delete set null
);

create table notification (
    id int primary key auto_increment,
    user_id int not null,
    title varchar(100),
    message text,
    is_read boolean not null default false,
    created_at datetime default current_timestamp,
    index idx_notification_user_read (user_id, is_read),
    foreign key (user_id) references users(id) on delete cascade
);

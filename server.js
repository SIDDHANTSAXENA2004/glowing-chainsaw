const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const scripts = `
# ---------------------------------------------------------
# assign8.tcl
# ---------------------------------------------------------
# Create Simulator
set ns [new Simulator]

# Open trace files
set nf [open even.nam w]
$ns namtrace-all $nf

set nt [open even.tr w]
$ns trace-all $nt

# Finish procedure
proc finish {} {
    global ns nf nt
    $ns flush-trace
    close $nf
    close $nt
    exec nam even.nam &
    exit 0
}

# Create 6 nodes
set n0 [$ns node]
set n1 [$ns node]
set n2 [$ns node]
set n3 [$ns node]
set n4 [$ns node]
set n5 [$ns node]

# Create links (bottleneck at n2-n3)
$ns duplex-link $n0 $n2 3Mb 10ms DropTail
$ns duplex-link $n1 $n2 3Mb 10ms DropTail
$ns duplex-link $n2 $n3 1Mb 20ms DropTail   
$ns duplex-link $n3 $n4 2Mb 15ms DropTail
$ns duplex-link $n3 $n5 2Mb 15ms DropTail

# Queue limit (to observe congestion)
$ns queue-limit $n2 $n3 10

# Coloring flows
$ns color 1 Blue
$ns color 2 Red

# TCP + FTP (n0 → n4)
set tcp [new Agent/TCP]
$tcp set fid_ 1
$ns attach-agent $n0 $tcp

set sink [new Agent/TCPSink]
$ns attach-agent $n4 $sink

$ns connect $tcp $sink

set ftp [new Application/FTP]
$ftp attach-agent $tcp

# UDP + CBR (n1 → n5)
set udp [new Agent/UDP]
$udp set fid_ 2
$ns attach-agent $n1 $udp

set null [new Agent/Null]
$ns attach-agent $n5 $null

$ns connect $udp $null

set cbr [new Application/Traffic/CBR]
$cbr attach-agent $udp
$cbr set packetSize_ 1000
$cbr set interval_ 0.005

# Start/Stop
$ns at 0.5 "$ftp start"
$ns at 1.0 "$cbr start"

$ns at 6.0 "$ftp stop"
$ns at 6.0 "$cbr stop"

# Finish
$ns at 6.5 "finish"

# Run
$ns run


# ---------------------------------------------------------
# delay.awk
# ---------------------------------------------------------
BEGIN {
    highest_packet_id = 0;
}
{
    action = $1;
    time = $2;
    packet_id = $12;

    if (packet_id > highest_packet_id)
        highest_packet_id = packet_id;

    if (start_time[packet_id] == 0)
        start_time[packet_id] = time;

    if (action == "r") {
        end_time[packet_id] = time;
    }
}
END {
    for (i = 0; i < highest_packet_id; i++) {
        if (end_time[i] > start_time[i]) {
            delay = end_time[i] - start_time[i];
            print start_time[i], delay;
        }
    }
}


# ---------------------------------------------------------
# stats.awk
# ---------------------------------------------------------
BEGIN {
    recv=0; drop=0; enqueue=0; dequeue=0;
}
{
    if ($1=="r") recv++;
    if ($1=="d") drop++;
    if ($1=="+") enqueue++;
    if ($1=="-") dequeue++;
}
END {
    printf("Received: %d\\n", recv);
    printf("Dropped: %d\\n", drop);
    printf("Enqueued: %d\\n", enqueue);
    printf("Dequeued: %d\\n", dequeue);
}


# ---------------------------------------------------------
# throughput.awk
# ---------------------------------------------------------
BEGIN { bytes=0; }
{
    if ($1=="r") {
        bytes += $6;
        time = $2;
    }
}
END {
    if (time > 0) {
        throughput = (bytes * 8) / time;
        print "Throughput (bps):", throughput;
    } else {
        print "Throughput (bps): 0";
    }
}
`;

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(scripts);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

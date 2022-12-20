const serialport = require("serialport");
const SerialPort = serialport.SerialPort;
/*SerialPort.list().then((ports) => {
   ports.forEach(function (port) {
      console.log(port.path)
   })
})*/
const comPort1 = new SerialPort({
    path: 'COM7',
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'even',
});

const req_pos_Buf = Buffer.from([0xC8, 0x37]);
const req_dir_Buf = Buffer.from([0xEC, 0x13]);
let prev_buf = [];
let req_dir_chg = true;
let qr_read_interval;

comPort1.on('readable', function () {
    if (req_dir_chg == true) 
    {
        let first_buf = comPort1.read(3);
        console.log('read Data:', first_buf);
        req_dir_chg = false;
    }
    else if (req_dir_chg == false) {
        let buf = comPort1.read(21);
        if (JSON.stringify(buf) != JSON.stringify(prev_buf)) {
            console.log('read Data:', buf);
            let x_pos_str = "";
            let y_pos_str = "";
            let ang_pos_str = "";
            let tag_num = "";
            let no_line = false;
            if(buf[1] & 0x40 > 0x00) // qr code
            {
                x_pos_str = ((buf[2] << 21) & 0x07) | (buf[3] << 14) | (buf[4] << 7) | buf[5]; // unsigned 
                y_pos_str = buf[6] << 7 | buf[7]; //signed - vertical distance from detected line
                ang_pos_str = buf[10] << 7 | buf[11]; // angle 
                tag_num = (buf[14] << 21 | buf[15] << 14 | buf[16] << 7 | buf[17]); //tag number
                no_line = true;
            }
            else // line
            {
                x_pos_str = ((buf[2] & 0x07) << 21) | (buf[3] << 14) | (buf[4] << 7) | buf[5]; // unsigned 
                y_pos_str = buf[6] << 7 | buf[7]; //signed - vertical distance from detected line
                ang_pos_str = buf[10] << 7 | buf[11]; // angle 
                tag_num = (buf[14] << 21 | buf[15] << 14 | buf[16] << 7 | buf[17]); //tag number
                no_line = false;
            }
            console.log(x_pos_str);
            console.log(y_pos_str);
            console.log(ang_pos_str);
            prev_buf = buf;
            let return_data = {xpos:x_pos_str, ypos:y_pos_str, angpos: ang_pos_str, tagnum:tag_num};
        }
    }
});
function req_pgv(buf_data) // request to pgv100
{
    comPort1.write(buf_data, () => {
    });
    setTimeout(pos_req_interval_func, 1000);
}
function booting_func()
{
    req_pgv(req_dir_Buf); // request direction set to pgv100
}
function pos_req_interval_func()
{
   qr_read_interval = setInterval(req_pgv, 50, req_pos_Buf); // every 50ms request position to pgv100
}
setTimeout(booting_func, 10);

---
title: "5.13 - Serwer SMB"
order: 13
---

```bash
locate smbserver.py
#If missing: sudo apt install python3-impacket
sudo python3 /usr/share/doc/python3-impacket/examples/smbserver.py -ip 0.0.0.0 -smb2support pjatksmbshare "$HOME"
```

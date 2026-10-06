"""Direct-test compatibility shims.

The real fixtures (direct_vm, direct_deploy, direct_alice, direct_bob) come
from genlayer-test when that package is installed.
"""

import os
import tempfile

import pytest


@pytest.fixture(autouse=True)
def _windows_safe_message_injection(monkeypatch):
    """Keep genlayer-test stdin temp files alive until VM cleanup on Windows.

    genlayer-test 0.30.0rc2 swaps fd 0 to a temp file and immediately unlinks
    the file. POSIX allows that, Windows does not, so direct_deploy fails before
    the contract is imported. This keeps the file path around and deletes it
    after the VM restores stdin.
    """
    try:
        import gltest.direct.loader as loader
        import gltest.direct.vm as vm_module
    except Exception:
        yield
        return

    def inject_message_to_fd0(vm):
        try:
            calldata = loader.import_calldata()
            Address = loader.import_address()
        except ImportError:
            return

        sender_addr = vm.sender
        if isinstance(sender_addr, bytes):
            sender_addr = Address(sender_addr)

        contract_addr = vm._contract_address
        if isinstance(contract_addr, bytes):
            contract_addr = Address(contract_addr)

        origin_addr = vm.origin
        if isinstance(origin_addr, bytes):
            origin_addr = Address(origin_addr)

        message_data = {
            "contract_address": contract_addr,
            "sender_address": sender_addr,
            "origin_address": origin_addr,
            "stack": [],
            "value": vm._value,
            "datetime": vm._datetime,
            "is_init": False,
            "chain_id": vm._chain_id,
            "entry_kind": 0,
            "entry_data": b"",
            "entry_stage_data": None,
        }

        encoded = calldata.encode(message_data)
        fd, path = tempfile.mkstemp()
        os.write(fd, encoded)
        os.lseek(fd, 0, os.SEEK_SET)

        vm._original_stdin_fd = os.dup(0)
        paths = getattr(vm, "_rainline_stdin_temp_paths", [])
        paths.append(path)
        vm._rainline_stdin_temp_paths = paths
        os.dup2(fd, 0)
        os.close(fd)

    original_cleanup = vm_module.VMContext._cleanup_after_deactivate

    def cleanup_after_deactivate(self):
        original_cleanup(self)
        for path in getattr(self, "_rainline_stdin_temp_paths", []):
            try:
                os.unlink(path)
            except OSError:
                pass
        self._rainline_stdin_temp_paths = []

    monkeypatch.setattr(loader, "_inject_message_to_fd0", inject_message_to_fd0)
    monkeypatch.setattr(vm_module.VMContext, "_cleanup_after_deactivate", cleanup_after_deactivate)
    yield

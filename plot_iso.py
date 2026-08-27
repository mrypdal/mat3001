import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(6, 5))
ax.set_aspect('equal')
ax.axis('off')

# Plot 1: A circle
theta = np.linspace(0, 2*np.pi, 200)
R = 1
x_circle = R * np.cos(theta)
y_circle = R * np.sin(theta)

# Plot 2: A blob with the same perimeter
# Let's create a deformed circle.
# Perimeter of circle is 2*pi*R.
# Let's just draw an ellipse or a smooth blob and write "Same length, smaller area"
# Actually, an ellipse with semi-axes a and b.
# An ellipse with a=1.2, b=0.8. Perimeter approx 2*pi*sqrt((a^2+b^2)/2) = 2*pi*sqrt((1.44+0.64)/2) = 2*pi*sqrt(1.04) > 2*pi
# Let's just make a generic blob.
blob_r = R * (1 + 0.2*np.sin(3*theta) + 0.1*np.cos(5*theta))
# Normalize the perimeter to exactly 2*pi*R
# compute perimeter:
blob_dx = np.gradient(blob_r * np.cos(theta))
blob_dy = np.gradient(blob_r * np.sin(theta))
perim = np.sum(np.sqrt(blob_dx**2 + blob_dy**2))
# scale blob:
scale = (2*np.pi*R) / perim
x_blob = 3.5 + scale * blob_r * np.cos(theta)
y_blob = scale * blob_r * np.sin(theta)

# Fill and plot the shapes
ax.fill(x_circle, y_circle, 'lightblue', alpha=0.5)
ax.plot(x_circle, y_circle, 'b-', linewidth=2)
ax.text(0, 0, 'Area: $A_{max}$\nPerimeter: $L$', ha='center', va='center', fontsize=12)

ax.fill(x_blob, y_blob, 'lightcoral', alpha=0.5)
ax.plot(x_blob, y_blob, 'r--', linewidth=2)
ax.text(3.5, 0, 'Area: $A < A_{max}$\nPerimeter: $L$', ha='center', va='center', fontsize=12)

plt.title('The Isoperimetric Problem: Circle maximizes area for a fixed perimeter', y=1.05)
plt.tight_layout()
plt.savefig('public/isoperimetric.svg', format='svg', transparent=True)
plt.close()
print("Plot generated.")
